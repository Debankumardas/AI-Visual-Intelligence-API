from pydantic import BaseModel


class PreferencesResponse(BaseModel):
    dashboard_enabled: bool
    image_analysis_enabled: bool
    video_analysis_enabled: bool
    analysis_completed_notifications: bool
    system_notifications: bool


class PreferencesUpdate(BaseModel):
    dashboard_enabled: bool | None = None
    image_analysis_enabled: bool | None = None
    video_analysis_enabled: bool | None = None
    analysis_completed_notifications: bool | None = None
    system_notifications: bool | None = None
