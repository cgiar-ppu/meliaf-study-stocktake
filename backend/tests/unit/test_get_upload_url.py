"""Tests for get_upload_url Lambda handler."""

import json
import os
import pytest
from unittest.mock import patch, MagicMock


os.environ["FILES_BUCKET"] = "test-files-bucket"


class TestGetUploadUrl:
    @pytest.fixture(autouse=True)
    def setup(self, mock_dynamodb, api_gw_event, valid_submission_body):
        """Set up a submission for file upload tests."""
        from create_submission.app import lambda_handler as create_handler

        event = {**api_gw_event, "httpMethod": "POST", "body": json.dumps(valid_submission_body)}
        result = json.loads(create_handler(event, None)["body"])
        self.submission_id = result["submissionId"]

    @patch("get_upload_url.app.s3_client")
    def test_generates_presigned_url(self, mock_s3, api_gw_event):
        from get_upload_url.app import lambda_handler

        mock_s3.generate_presigned_url.return_value = "https://s3.amazonaws.com/presigned-url"

        event = {
            **api_gw_event,
            "httpMethod": "POST",
            "pathParameters": {"id": self.submission_id},
            "body": json.dumps({"filename": "data.xlsx", "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "uploadUrl" in body
        assert "key" in body
        assert body["filename"] == "data.xlsx"
        mock_s3.generate_presigned_url.assert_called_once()

    def test_rejects_invalid_content_type(self, api_gw_event):
        from get_upload_url.app import lambda_handler

        event = {
            **api_gw_event,
            "httpMethod": "POST",
            "pathParameters": {"id": self.submission_id},
            "body": json.dumps({"filename": "malware.exe", "contentType": "application/x-executable"}),
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "not allowed" in body["error"]

    def test_rejects_missing_filename(self, api_gw_event):
        from get_upload_url.app import lambda_handler

        event = {
            **api_gw_event,
            "httpMethod": "POST",
            "pathParameters": {"id": self.submission_id},
            "body": json.dumps({"contentType": "image/png"}),
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400

    def test_not_found_for_missing_submission(self, api_gw_event):
        from get_upload_url.app import lambda_handler

        event = {
            **api_gw_event,
            "httpMethod": "POST",
            "pathParameters": {"id": "nonexistent-id"},
            "body": json.dumps({"filename": "test.png", "contentType": "image/png"}),
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 404
