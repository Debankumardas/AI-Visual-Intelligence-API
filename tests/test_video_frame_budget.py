from unittest.mock import patch

import numpy as np
import pytest

from app.services.detection_service import detection_service
from app.services.video_processing_service import VideoProcessingService
from app.services.video_service import video_service
from app.services.video_writer_service import video_writer_service


def make_frames(count):
    return [
        (index, np.zeros((10, 10, 3), dtype=np.uint8))
        for index in range(count)
    ]


def empty_tracking(image):
    return {
        "tracks": [],
        "detections": [],
        "inference_time_ms": 1.0,
    }


# ============================================================
# FRAME SAMPLING PLAN
# ============================================================


@pytest.mark.parametrize(
    ("frame_count", "budget", "expected_stride"),
    [
        (900, 300, 3),
        (901, 300, 4),
        (300, 300, 1),
        (10, 300, 1),
        (0, 300, 1),
    ],
)
def test_plan_frame_sampling_auto_stride(
    frame_count,
    budget,
    expected_stride,
):
    service = VideoProcessingService()

    assert service.plan_frame_sampling(
        source_frame_count=frame_count,
        max_frames=budget,
    ) == (expected_stride, budget)


def test_plan_frame_sampling_keeps_explicit_stride():
    service = VideoProcessingService()

    assert service.plan_frame_sampling(
        source_frame_count=900,
        frame_stride=2,
        max_frames=300,
    ) == (2, 300)


def test_plan_frame_sampling_uses_configured_budget():
    service = VideoProcessingService()

    class FakeSettings:
        video_max_processed_frames = 50

    with patch(
        "app.services.video_processing_service.settings",
        FakeSettings(),
    ):
        assert service.plan_frame_sampling(
            source_frame_count=500,
        ) == (10, 50)


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"frame_stride": 0}, "Frame stride must be at least 1"),
        ({"max_frames": 0}, "Max frames must be at least 1"),
    ],
)
def test_plan_frame_sampling_rejects_invalid_values(kwargs, message):
    service = VideoProcessingService()

    with pytest.raises(ValueError, match=message):
        service.plan_frame_sampling(
            source_frame_count=100,
            **kwargs,
        )


# ============================================================
# ANALYSIS WITHIN THE BUDGET
# ============================================================


def test_analyze_video_samples_long_videos_evenly():
    service = VideoProcessingService()

    with (
        patch.object(
            video_service,
            "get_metadata",
            return_value={"frame_count": 900},
        ),
        patch.object(
            video_service,
            "read_frames",
            return_value=iter(make_frames(300)),
        ) as read_frames_mock,
        patch.object(
            detection_service,
            "track",
            side_effect=empty_tracking,
        ) as track_mock,
    ):
        result = service.analyze_video(
            "long.mp4",
            max_frames=300,
        )

    read_frames_mock.assert_called_once_with(
        "long.mp4",
        frame_stride=3,
    )

    assert track_mock.call_count == 300
    assert result["frame_stride"] == 3
    assert result["source_frame_count"] == 900
    assert result["frames_processed"] == 300


def test_analyze_video_stops_at_budget_when_frame_count_unknown():
    service = VideoProcessingService()

    with (
        patch.object(
            video_service,
            "get_metadata",
            return_value={"frame_count": 0},
        ),
        patch.object(
            video_service,
            "read_frames",
            return_value=iter(make_frames(10)),
        ),
        patch.object(
            detection_service,
            "track",
            side_effect=empty_tracking,
        ) as track_mock,
    ):
        result = service.analyze_video(
            "unknown-length.mp4",
            max_frames=4,
        )

    assert track_mock.call_count == 4
    assert result["frame_stride"] == 1
    assert result["frames_processed"] == 4


def test_track_persistence_is_not_diluted_by_frame_sampling():
    service = VideoProcessingService()

    # Frames 0, 3, 6 and 9 are analysed (stride 3) and the same track
    # is visible in all of them.
    sampled_frames = [
        (index, np.zeros((10, 10, 3), dtype=np.uint8))
        for index in (0, 3, 6, 9)
    ]

    box = {"x1": 0.0, "y1": 0.0, "x2": 10.0, "y2": 10.0}

    def tracking_with_one_track(image):
        track = {
            "track_id": 1,
            "label": "person",
            "confidence": 0.9,
            "box": box,
        }

        return {
            "tracks": [track],
            "detections": [
                {key: value for key, value in track.items() if key != "track_id"}
            ],
            "inference_time_ms": 1.0,
        }

    with (
        patch.object(
            video_service,
            "get_metadata",
            return_value={"frame_count": 10},
        ),
        patch.object(
            video_service,
            "read_frames",
            return_value=iter(sampled_frames),
        ),
        patch.object(
            detection_service,
            "track",
            side_effect=tracking_with_one_track,
        ),
    ):
        result = service.analyze_video(
            "sampled.mp4",
            frame_stride=3,
        )

    assert result["frame_stride"] == 3
    assert result["track_observed_frames"] == {1: 4}
    assert result["track_persistence_ratio"] == {1: 1.0}

    # Durations stay expressed in source frames (0..9 inclusive).
    assert result["track_duration_frames"] == {1: 10}


def test_analyze_video_rejects_invalid_stride_before_reading():
    service = VideoProcessingService()

    with patch.object(video_service, "get_metadata") as metadata_mock:
        with pytest.raises(
            ValueError,
            match="Frame stride must be at least 1",
        ):
            service.analyze_video(
                "sample.mp4",
                frame_stride=0,
            )

    metadata_mock.assert_not_called()


def test_analyze_video_runs_in_a_fresh_tracking_session():
    service = VideoProcessingService()

    session_events = []

    original_reset = detection_service.reset_tracker

    def recording_reset():
        session_events.append("reset")
        original_reset()

    def recording_track(image):
        session_events.append("track")
        return empty_tracking(image)

    with (
        patch.object(
            detection_service,
            "reset_tracker",
            side_effect=recording_reset,
        ),
        patch.object(
            video_service,
            "get_metadata",
            return_value={"frame_count": 2},
        ),
        patch.object(
            video_service,
            "read_frames",
            return_value=iter(make_frames(2)),
        ),
        patch.object(
            detection_service,
            "track",
            side_effect=recording_track,
        ),
    ):
        service.analyze_video("sample.mp4")

    assert session_events == ["reset", "track", "track"]


# ============================================================
# ANNOTATED VIDEO WITHIN THE BUDGET
# ============================================================


def test_generate_annotated_video_scales_output_fps(
    monkeypatch,
    tmp_path,
):
    service = VideoProcessingService()
    output_path = str(tmp_path / "annotated.mp4")

    captured = {}

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 900,
            "fps": 30.0,
            "width": 10,
            "height": 10,
        },
    )

    def fake_read_frames(path, frame_stride=1):
        captured["frame_stride"] = frame_stride
        return iter(make_frames(1000))

    monkeypatch.setattr(video_service, "read_frames", fake_read_frames)
    monkeypatch.setattr(detection_service, "track", empty_tracking)

    def fake_create_writer(output_path, fps, width, height):
        captured["fps"] = fps
        return object()

    written = []

    monkeypatch.setattr(
        video_writer_service,
        "create_writer",
        fake_create_writer,
    )
    monkeypatch.setattr(
        video_writer_service,
        "write_frame",
        lambda writer, frame: written.append(frame),
    )
    monkeypatch.setattr(
        video_writer_service,
        "release",
        lambda writer: None,
    )

    service.generate_annotated_video(
        video_path="input.mp4",
        output_path=output_path,
        max_frames=300,
    )

    assert captured["frame_stride"] == 3
    assert captured["fps"] == 10.0
    assert len(written) == 300
