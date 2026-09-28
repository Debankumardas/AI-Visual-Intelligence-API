import pytest

from app.services.video_analytics_service import (
    VideoAnalyticsService,
    video_analytics_service,
)


def test_calculate_metrics():
    service = VideoAnalyticsService()

    metrics = service.calculate_metrics(
        inference_times_ms=[10.0, 20.0, 30.0],
        processing_time_seconds=0.5,
    )

    assert metrics["frames_processed"] == 3
    assert metrics["processing_time_seconds"] == 0.5
    assert metrics["effective_fps"] == 6.0
    assert metrics["total_inference_time_ms"] == 60.0
    assert metrics["average_inference_time_ms"] == 20.0
    assert metrics["min_inference_time_ms"] == 10.0
    assert metrics["max_inference_time_ms"] == 30.0


def test_calculate_metrics_empty_results():
    service = VideoAnalyticsService()

    metrics = service.calculate_metrics(
        inference_times_ms=[],
        processing_time_seconds=0.0,
    )

    assert metrics["frames_processed"] == 0
    assert metrics["processing_time_seconds"] == 0.0
    assert metrics["effective_fps"] == 0.0
    assert metrics["total_inference_time_ms"] == 0.0
    assert metrics["average_inference_time_ms"] == 0.0
    assert metrics["min_inference_time_ms"] == 0.0
    assert metrics["max_inference_time_ms"] == 0.0


def test_calculate_detection_metrics():
    service = VideoAnalyticsService()

    metrics = service.calculate_detection_metrics(
        detection_counts=[2, 4, 1, 3],
    )

    assert metrics["total_detections"] == 10
    assert metrics["max_detections_per_frame"] == 4
    assert metrics["average_detections_per_frame"] == 2.5


def test_calculate_detection_metrics_empty():
    service = VideoAnalyticsService()

    metrics = service.calculate_detection_metrics(
        detection_counts=[],
    )

    assert metrics["total_detections"] == 0
    assert metrics["max_detections_per_frame"] == 0
    assert metrics["average_detections_per_frame"] == 0.0


def test_calculate_tracking_metrics():
    service = VideoAnalyticsService()

    track_ids_per_frame = [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3, 4],
    ]

    result = service.calculate_tracking_metrics(
        track_ids_per_frame
    )

    assert result["total_track_observations"] == 10
    assert result["unique_track_ids"] == 4
    assert result["max_tracks_per_frame"] == 4
    assert result["average_tracks_per_frame"] == 3.333


def test_calculate_tracking_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_tracking_metrics([])

    assert result == {
        "total_track_observations": 0,
        "unique_track_ids": 0,
        "max_tracks_per_frame": 0,
        "average_tracks_per_frame": 0.0,
    }


def test_calculate_class_detection_metrics():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "person"},
            {"label": "car"},
            {"label": "car"},
        ],
        [
            {"label": "car"},
        ],
    ]

    result = service.calculate_class_detection_metrics(
        detections_per_frame
    )

    assert result["class_detection_counts"] == {
        "person": 3,
        "car": 4,
    }

    assert result["max_detections_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["average_detections_by_class"] == {
        "person": 1.0,
        "car": 1.333,
    }


def test_calculate_class_detection_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_class_detection_metrics([])

    assert result == {
        "class_detection_counts": {},
        "max_detections_by_class": {},
        "average_detections_by_class": {},
    }


def test_calculate_class_tracking_metrics():
    tracks_per_frame = [
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 2, "label": "person"},
            {"track_id": 3, "label": "car"},
        ],
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 2, "label": "person"},
            {"track_id": 3, "label": "car"},
            {"track_id": 4, "label": "car"},
        ],
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 3, "label": "car"},
        ],
    ]

    result = (
        video_analytics_service.calculate_class_tracking_metrics(
            tracks_per_frame
        )
    )

    assert result["class_tracking_counts"] == {
        "person": 5,
        "car": 4,
    }

    assert result["unique_track_ids_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["max_tracks_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["average_tracks_by_class"] == {
        "person": 1.667,
        "car": 1.333,
    }


def test_calculate_class_tracking_metrics_empty():
    result = (
        video_analytics_service.calculate_class_tracking_metrics(
            []
        )
    )

    assert result == {
        "class_tracking_counts": {},
        "unique_track_ids_by_class": {},
        "max_tracks_by_class": {},
        "average_tracks_by_class": {},
    }


def test_calculate_temporal_detection_metrics():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "person"},
        ],
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [],
        [
            {"label": "car"},
        ],
    ]

    frame_indices = [0, 1, 2, 3, 4]

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=detections_per_frame,
        frame_indices=frame_indices,
    )

    assert result["first_detection_frame"] == {
        "person": 0,
        "car": 0,
    }

    assert result["last_detection_frame"] == {
        "person": 2,
        "car": 4,
    }

    assert result["active_frames_by_class"] == {
        "person": 3,
        "car": 3,
    }

    assert result["class_presence_ratio"] == {
        "person": 0.6,
        "car": 0.6,
    }


def test_calculate_temporal_detection_metrics_with_frame_stride():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
        ],
        [],
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "car"},
        ],
    ]

    frame_indices = [0, 4, 8, 12]

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=detections_per_frame,
        frame_indices=frame_indices,
    )

    assert result["first_detection_frame"] == {
        "person": 0,
        "car": 8,
    }

    assert result["last_detection_frame"] == {
        "person": 8,
        "car": 12,
    }

    assert result["active_frames_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["class_presence_ratio"] == {
        "person": 0.5,
        "car": 0.5,
    }


def test_calculate_temporal_detection_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "first_detection_frame": {},
        "last_detection_frame": {},
        "active_frames_by_class": {},
        "class_presence_ratio": {},
    }


def test_calculate_temporal_detection_metrics_mismatched_lengths():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [{"label": "person"}],
        [{"label": "car"}],
    ]

    frame_indices = [0]

    with pytest.raises(
        ValueError,
        match="Detection frames and frame indices must have the same length",
    ):
        service.calculate_temporal_detection_metrics(
            detections_per_frame=detections_per_frame,
            frame_indices=frame_indices,
        )


def test_calculate_track_duration_metrics():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[
            [1, 2],
            [1],
            [1, 2],
            [2],
        ],
        frame_indices=[
            0,
            1,
            2,
            3,
        ],
    )

    assert result == {
        "track_duration_frames": {
            1: 3,
            2: 4,
        },
    }


def test_calculate_track_duration_metrics_with_frame_stride():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[
            [5],
            [5],
            [5],
        ],
        frame_indices=[
            0,
            2,
            4,
        ],
    )

    assert result == {
        "track_duration_frames": {
            5: 5,
        },
    }


def test_calculate_track_duration_metrics_empty():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "track_duration_frames": {},
    }


def test_calculate_track_duration_metrics_mismatched_lengths():
    with pytest.raises(
        ValueError,
        match="Track frames and frame indices must have the same length",
    ):
        video_analytics_service.calculate_track_duration_metrics(
            track_ids_per_frame=[
                [1],
            ],
            frame_indices=[],
        )


def test_calculate_track_persistence_metrics():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[
            [1, 2],
            [1],
            [1, 2],
            [2],
        ],
        frame_indices=[0, 1, 2, 3],
    )

    assert result == {
        "track_observed_frames": {
            1: 3,
            2: 3,
        },
        "track_persistence_ratio": {
            1: 1.0,
            2: 0.75,
        },
    }


def test_calculate_track_persistence_with_missing_frames():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[
            [5],
            [],
            [5],
            [],
            [5],
        ],
        frame_indices=[0, 1, 2, 3, 4],
    )

    assert result == {
        "track_observed_frames": {
            5: 3,
        },
        "track_persistence_ratio": {
            5: 0.6,
        },
    }


def test_calculate_track_persistence_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "track_observed_frames": {},
        "track_persistence_ratio": {},
    }


def test_calculate_track_persistence_metrics_mismatched_lengths():
    service = VideoAnalyticsService()

    with pytest.raises(
        ValueError,
        match="Track frames and frame indices must have the same length",
    ):
        service.calculate_track_persistence_metrics(
            track_ids_per_frame=[
                [1],
                [1],
            ],
            frame_indices=[0],
        )


def test_calculate_track_gap_metrics():
    track_ids_per_frame = [
        [1],
        [1],
        [],
        [],
        [1],
        [1],
    ]

    result = video_analytics_service.calculate_track_gap_metrics(
        track_ids_per_frame
    )

    assert result["track_gap_count"] == {1: 1}
    assert result["track_total_gap_frames"] == {1: 2}
    assert result["track_max_gap_frames"] == {1: 2}


def test_calculate_track_gap_metrics_multiple_gaps():
    track_ids_per_frame = [
        [1],
        [],
        [1],
        [],
        [],
        [1],
    ]

    result = video_analytics_service.calculate_track_gap_metrics(
        track_ids_per_frame
    )

    assert result["track_gap_count"] == {1: 2}
    assert result["track_total_gap_frames"] == {1: 3}
    assert result["track_max_gap_frames"] == {1: 2}


def test_calculate_track_gap_metrics_multiple_tracks():
    track_ids_per_frame = [
        [1, 2],
        [1],
        [2],
        [],
        [1, 2],
    ]

    result = video_analytics_service.calculate_track_gap_metrics(
        track_ids_per_frame
    )

    assert result["track_gap_count"] == {1: 1, 2: 2}
    assert result["track_total_gap_frames"] == {1: 2, 2: 2}
    assert result["track_max_gap_frames"] == {1: 2, 2: 1}


def test_calculate_track_gap_metrics_empty():
    result = video_analytics_service.calculate_track_gap_metrics([])

    assert result["track_gap_count"] == {}
    assert result["track_total_gap_frames"] == {}
    assert result["track_max_gap_frames"] == {}


def test_calculate_track_gap_metrics_track_ends_during_gap():
    track_ids_per_frame = [
        [1],
        [1],
        [1],
        [],
        [],
    ]

    result = video_analytics_service.calculate_track_gap_metrics(
        track_ids_per_frame
    )

    assert result["track_gap_count"] == {}
    assert result["track_total_gap_frames"] == {}
    assert result["track_max_gap_frames"] == {}


def test_calculate_track_cooccurrence_metrics():
    service = VideoAnalyticsService()

    result = service.calculate_track_cooccurrence_metrics(
        track_ids_per_frame=[
            [1, 2],
            [1, 2],
            [1],
            [1, 3],
        ]
    )

    assert result == {
        "track_cooccurrence_counts": {
            "1,2": 2,
            "1,3": 1,
        },
    }


def test_calculate_track_cooccurrence_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_cooccurrence_metrics([])

    assert result == {
        "track_cooccurrence_counts": {},
    }


def test_calculate_track_cooccurrence_metrics_duplicate_ids():
    service = VideoAnalyticsService()

    result = service.calculate_track_cooccurrence_metrics(
        track_ids_per_frame=[
            [1, 1, 2, 2],
            [1, 2],
        ]
    )

    assert result == {
        "track_cooccurrence_counts": {
            "1,2": 2,
        },
    }


def test_calculate_track_movement_metrics():
    service = VideoAnalyticsService()

    result = service.calculate_track_movement_metrics(
        tracks_per_frame=[
            [
                {
                    "track_id": 1,
                    "box": {
                        "x1": 0,
                        "y1": 0,
                        "x2": 10,
                        "y2": 10,
                    },
                }
            ],
            [
                {
                    "track_id": 1,
                    "box": {
                        "x1": 3,
                        "y1": 4,
                        "x2": 13,
                        "y2": 14,
                    },
                }
            ],
            [
                {
                    "track_id": 1,
                    "box": {
                        "x1": 6,
                        "y1": 8,
                        "x2": 16,
                        "y2": 18,
                    },
                }
            ],
        ],
        frame_indices=[0, 1, 2],
    )

    assert result == {
        "track_distance_travelled": {
            1: 10.0,
        },
        "track_average_speed": {
            1: 5.0,
        },
        "track_max_speed": {
            1: 5.0,
        },
    }


def test_calculate_track_movement_metrics_with_frame_stride():
    service = VideoAnalyticsService()

    result = service.calculate_track_movement_metrics(
        tracks_per_frame=[
            [
                {
                    "track_id": 1,
                    "box": {
                        "x1": 0,
                        "y1": 0,
                        "x2": 10,
                        "y2": 10,
                    },
                }
            ],
            [
                {
                    "track_id": 1,
                    "box": {
                        "x1": 6,
                        "y1": 8,
                        "x2": 16,
                        "y2": 18,
                    },
                }
            ],
        ],
        frame_indices=[0, 2],
    )

    assert result == {
        "track_distance_travelled": {
            1: 10.0,
        },
        "track_average_speed": {
            1: 5.0,
        },
        "track_max_speed": {
            1: 5.0,
        },
    }


def test_calculate_track_movement_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_movement_metrics(
        tracks_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "track_distance_travelled": {},
        "track_average_speed": {},
        "track_max_speed": {},
    }


def test_calculate_track_movement_metrics_mismatched_lengths():
    service = VideoAnalyticsService()

    with pytest.raises(
        ValueError,
        match="Track frames and frame indices must have the same length",
    ):
        service.calculate_track_movement_metrics(
            tracks_per_frame=[[]],
            frame_indices=[],
        )


def test_calculate_track_proximity_metrics():
    service = VideoAnalyticsService()

    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 10,
                    "y1": 0,
                    "x2": 20,
                    "y2": 10,
                },
            },
            {
                "track_id": 3,
                "box": {
                    "x1": 100,
                    "y1": 100,
                    "x2": 110,
                    "y2": 110,
                },
            },
        ],
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 10,
                    "y1": 0,
                    "x2": 20,
                    "y2": 10,
                },
            },
        ],
    ]

    result = service.calculate_track_proximity_metrics(
        tracks_per_frame=tracks_per_frame,
        distance_threshold=10,
    )

    assert result["track_proximity_counts"] == {
        "1,2": 2,
    }


def test_calculate_track_proximity_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_proximity_metrics(
        tracks_per_frame=[],
        distance_threshold=10,
    )

    assert result["track_proximity_counts"] == {}


def test_calculate_track_proximity_metrics_negative_threshold():
    service = VideoAnalyticsService()

    with pytest.raises(
        ValueError,
        match="Distance threshold must be non-negative",
    ):
        service.calculate_track_proximity_metrics(
            tracks_per_frame=[],
            distance_threshold=-1,
        )


def test_calculate_track_proximity_metrics_threshold_boundary():
    service = VideoAnalyticsService()

    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 10,
                    "y1": 0,
                    "x2": 20,
                    "y2": 10,
                },
            },
        ]
    ]

    result = service.calculate_track_proximity_metrics(
        tracks_per_frame=tracks_per_frame,
        distance_threshold=10,
    )

    assert result["track_proximity_counts"] == {
        "1,2": 1,
    }

def test_calculate_track_interaction_duration_metrics():
    service = VideoAnalyticsService()

    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0.0,
                    "y1": 0.0,
                    "x2": 10.0,
                    "y2": 10.0,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20.0,
                    "y1": 0.0,
                    "x2": 30.0,
                    "y2": 10.0,
                },
            },
        ],
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0.0,
                    "y1": 0.0,
                    "x2": 10.0,
                    "y2": 10.0,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20.0,
                    "y1": 0.0,
                    "x2": 30.0,
                    "y2": 10.0,
                },
            },
        ],
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0.0,
                    "y1": 0.0,
                    "x2": 10.0,
                    "y2": 10.0,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 100.0,
                    "y1": 0.0,
                    "x2": 110.0,
                    "y2": 10.0,
                },
            },
        ],
    ]

    result = service.calculate_track_interaction_duration_metrics(
        tracks_per_frame=tracks_per_frame,
        frame_indices=[10, 20, 35],
        distance_threshold=50.0,
    )

    assert result == {
        "track_interaction_duration": {
            "1,2": 10,
        },
    }


def test_calculate_track_interaction_duration_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_interaction_duration_metrics(
        tracks_per_frame=[],
        frame_indices=[],
        distance_threshold=50.0,
    )

    assert result == {
        "track_interaction_duration": {},
    }


def test_calculate_track_interaction_duration_metrics_negative_threshold():
    service = VideoAnalyticsService()

    with pytest.raises(ValueError, match="non-negative"):
        service.calculate_track_interaction_duration_metrics(
            tracks_per_frame=[],
            frame_indices=[],
            distance_threshold=-1.0,
        )


def test_calculate_track_interaction_duration_metrics_frame_mismatch():
    service = VideoAnalyticsService()

    with pytest.raises(
        ValueError,
        match="same length",
    ):
        service.calculate_track_interaction_duration_metrics(
            tracks_per_frame=[
                [
                    {
                        "track_id": 1,
                        "box": {
                            "x1": 0.0,
                            "y1": 0.0,
                            "x2": 10.0,
                            "y2": 10.0,
                        },
                    }
                ]
            ],
            frame_indices=[],
            distance_threshold=50.0,
        )

def test_calculate_track_interaction_episode_metrics():
    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20,
                    "y1": 0,
                    "x2": 30,
                    "y2": 10,
                },
            },
        ],
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20,
                    "y1": 0,
                    "x2": 30,
                    "y2": 10,
                },
            },
        ],
        [],
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20,
                    "y1": 0,
                    "x2": 30,
                    "y2": 10,
                },
            },
        ],
    ]

    result = video_analytics_service.calculate_track_interaction_episode_metrics(
        tracks_per_frame=tracks_per_frame,
        distance_threshold=25.0,
    )

    assert result == {
        "track_interaction_episodes": {
            "1,2": 2,
        },
    }

def test_calculate_track_interaction_episode_metrics_empty():
    result = video_analytics_service.calculate_track_interaction_episode_metrics(
        tracks_per_frame=[],
        distance_threshold=50.0,
    )

    assert result == {
        "track_interaction_episodes": {},
    }


def test_calculate_track_interaction_episode_metrics_negative_threshold():
    with pytest.raises(ValueError, match="Distance threshold must be non-negative"):
        video_analytics_service.calculate_track_interaction_episode_metrics(
            tracks_per_frame=[],
            distance_threshold=-1.0,
        )


def test_calculate_track_interaction_episode_metrics_single_observation():
    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20,
                    "y1": 0,
                    "x2": 30,
                    "y2": 10,
                },
            },
        ],
    ]

    result = video_analytics_service.calculate_track_interaction_episode_metrics(
        tracks_per_frame=tracks_per_frame,
        distance_threshold=25.0,
    )

    assert result == {
        "track_interaction_episodes": {
            "1,2": 1,
        },
    }

def test_calculate_track_interaction_episode_metrics_empty():
    result = video_analytics_service.calculate_track_interaction_episode_metrics(
        tracks_per_frame=[],
        distance_threshold=50.0,
    )

    assert result == {
        "track_interaction_episodes": {},
    }


def test_calculate_track_interaction_episode_metrics_negative_threshold():
    with pytest.raises(ValueError, match="Distance threshold must be non-negative"):
        video_analytics_service.calculate_track_interaction_episode_metrics(
            tracks_per_frame=[],
            distance_threshold=-1.0,
        )


def test_calculate_track_interaction_episode_metrics_single_observation():
    tracks_per_frame = [
        [
            {
                "track_id": 1,
                "box": {
                    "x1": 0,
                    "y1": 0,
                    "x2": 10,
                    "y2": 10,
                },
            },
            {
                "track_id": 2,
                "box": {
                    "x1": 20,
                    "y1": 0,
                    "x2": 30,
                    "y2": 10,
                },
            },
        ],
    ]

    result = video_analytics_service.calculate_track_interaction_episode_metrics(
        tracks_per_frame=tracks_per_frame,
        distance_threshold=25.0,
    )

    assert result == {
        "track_interaction_episodes": {
            "1,2": 1,
        },
    }