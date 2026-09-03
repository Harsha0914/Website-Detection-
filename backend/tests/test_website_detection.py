# pyrefly: ignore [missing-import]
import pytest
from app.services.website_detection_service import is_social_or_directory, sanitize_url
from app.services.website_analysis_service import calculate_quality_score
from app.models.business import WebsiteQuality

def test_social_media_filtering():
    assert is_social_or_directory("https://www.facebook.com/myshop") is True
    assert is_social_or_directory("https://instagram.com/localgrocery") is True
    assert is_social_or_directory("https://yelp.com/biz/local-mart") is True
    assert is_social_or_directory("https://myshop.com") is False
    assert is_social_or_directory("https://freshgrocery.org/about") is False

def test_sanitize_url():
    assert sanitize_url("example.com") == "https://example.com"
    assert sanitize_url("http://example.com") == "http://example.com"
    assert sanitize_url("https://example.com") == "https://example.com"

def test_quality_score_calculation():
    # Perfect score test
    perfect_metrics = {
        "is_reachable": True,
        "https_enabled": True,
        "mobile_viewport": True,
        "has_title": True,
        "has_meta_description": True,
        "has_contact_info": True,
        "has_phone": True,
        "has_email": True,
        "has_navigation": True,
        "has_social_links": True,
        "has_open_graph": True,
    }
    score, quality = calculate_quality_score(perfect_metrics)
    assert score == 100
    assert quality == WebsiteQuality.GOOD

    # Poor quality test
    poor_metrics = {
        "is_reachable": False,
        "https_enabled": False,
        "mobile_viewport": False,
    }
    score, quality = calculate_quality_score(poor_metrics)
    assert score == 0
    assert quality == WebsiteQuality.POOR
