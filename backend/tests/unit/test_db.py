"""Tests for shared.db — DynamoDB operations for submissions table."""

from shared.db import (
    put_submission,
    get_latest_active_version,
    get_latest_archived_version,
    list_user_submissions,
    get_version_history,
    mark_superseded,
    list_all_submissions,
    update_submission_status,
)


def _make_item(submission_id, version, status="active", user_id="user-1", created_at="2025-01-01T00:00:00Z"):
    return {
        "submissionId": submission_id,
        "version": version,
        "status": status,
        "userId": user_id,
        "createdAt": created_at,
        "studyTitle": f"Study v{version}",
    }


class TestPutSubmission:
    def test_stores_and_returns_item(self, mock_dynamodb):
        item = _make_item("sub-1", 1)
        result = put_submission(item)
        assert result == item

    def test_item_is_retrievable_after_put(self, mock_dynamodb):
        item = _make_item("sub-1", 1)
        put_submission(item)
        found = get_latest_active_version("sub-1")
        assert found["submissionId"] == "sub-1"


class TestGetLatestActiveVersion:
    def test_returns_newest_active_version(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, created_at="2025-01-01T00:00:00Z"))
        put_submission(_make_item("sub-1", 2, created_at="2025-01-02T00:00:00Z"))
        put_submission(_make_item("sub-1", 3, status="archived", created_at="2025-01-03T00:00:00Z"))
        result = get_latest_active_version("sub-1")
        assert result["version"] == 2

    def test_returns_none_when_no_active_versions(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="archived"))
        result = get_latest_active_version("sub-1")
        assert result is None

    def test_returns_none_for_unknown_id(self, mock_dynamodb):
        result = get_latest_active_version("nonexistent")
        assert result is None

    def test_skips_superseded_versions(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="superseded"))
        put_submission(_make_item("sub-1", 2, status="active"))
        result = get_latest_active_version("sub-1")
        assert result["version"] == 2


class TestGetLatestArchivedVersion:
    def test_returns_newest_archived_version(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="active"))
        put_submission(_make_item("sub-1", 2, status="archived"))
        put_submission(_make_item("sub-1", 3, status="archived"))
        result = get_latest_archived_version("sub-1")
        assert result["version"] == 3

    def test_returns_none_when_none_archived(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="active"))
        result = get_latest_archived_version("sub-1")
        assert result is None


class TestListUserSubmissions:
    def test_returns_user_active_submissions(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, user_id="user-a", created_at="2025-01-01T00:00:00Z"))
        put_submission(_make_item("sub-2", 1, user_id="user-a", created_at="2025-01-02T00:00:00Z"))
        put_submission(_make_item("sub-3", 1, user_id="user-b", created_at="2025-01-03T00:00:00Z"))
        results = list_user_submissions("user-a")
        assert len(results) == 2
        assert all(r["userId"] == "user-a" for r in results)

    def test_filters_by_status(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, user_id="user-a", status="active", created_at="2025-01-01T00:00:00Z"))
        put_submission(_make_item("sub-2", 1, user_id="user-a", status="archived", created_at="2025-01-02T00:00:00Z"))
        results = list_user_submissions("user-a", status_filter="archived")
        assert len(results) == 1
        assert results[0]["status"] == "archived"

    def test_returns_empty_for_unknown_user(self, mock_dynamodb):
        results = list_user_submissions("unknown-user")
        assert results == []


class TestGetVersionHistory:
    def test_returns_all_versions_newest_first(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1))
        put_submission(_make_item("sub-1", 2, status="superseded"))
        put_submission(_make_item("sub-1", 3, status="archived"))
        results = get_version_history("sub-1")
        assert len(results) == 3
        assert results[0]["version"] == 3
        assert results[1]["version"] == 2
        assert results[2]["version"] == 1

    def test_returns_empty_for_unknown_id(self, mock_dynamodb):
        results = get_version_history("nonexistent")
        assert results == []


class TestMarkSuperseded:
    def test_updates_status_to_superseded(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="active"))
        mark_superseded("sub-1", 1)
        result = get_latest_active_version("sub-1")
        assert result is None
        history = get_version_history("sub-1")
        assert history[0]["status"] == "superseded"


class TestListAllSubmissions:
    def test_returns_all_active_submissions(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, user_id="user-a", created_at="2025-01-01T00:00:00Z"))
        put_submission(_make_item("sub-2", 1, user_id="user-b", created_at="2025-01-02T00:00:00Z"))
        put_submission(_make_item("sub-3", 1, user_id="user-c", status="archived", created_at="2025-01-03T00:00:00Z"))
        results = list_all_submissions()
        assert len(results) == 2

    def test_filters_by_status(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="active", created_at="2025-01-01T00:00:00Z"))
        put_submission(_make_item("sub-2", 1, status="archived", created_at="2025-01-02T00:00:00Z"))
        results = list_all_submissions(status_filter="archived")
        assert len(results) == 1
        assert results[0]["status"] == "archived"


class TestUpdateSubmissionStatus:
    def test_updates_status_and_sets_updated_at(self, mock_dynamodb):
        put_submission(_make_item("sub-1", 1, status="active"))
        update_submission_status("sub-1", 1, "archived")
        history = get_version_history("sub-1")
        assert history[0]["status"] == "archived"
        assert "updatedAt" in history[0]
