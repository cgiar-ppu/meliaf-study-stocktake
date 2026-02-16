"""Tests for delete_file Lambda handler."""

import json
import os
import pytest
from unittest.mock import patch


os.environ["FILES_BUCKET"] = "test-files-bucket"


class TestDeleteFile:
    @pytest.fixture(autouse=True)
    def setup(self, mock_dynamodb, api_gw_event, valid_submission_body):
        from create_submission.app import lambda_handler as create_handler
        from shared.db import get_latest_active_version

        event = {**api_gw_event, "httpMethod": "POST", "body": json.dumps(valid_submission_body)}
        result = json.loads(create_handler(event, None)["body"])
        self.submission_id = result["submissionId"]
        sub = get_latest_active_version(self.submission_id)
        self.created_at = str(sub["createdAt"])[:10]
        self.prefix = f"{self.created_at}_{self.submission_id}/files/"

    @patch("delete_file.app.s3_client")
    def test_deletes_file(self, mock_s3, api_gw_event):
        from delete_file.app import lambda_handler

        mock_s3.list_objects_v2.return_value = {
            "Contents": [
                {"Key": f"{self.prefix}abc12345_report.pdf", "Size": 1024},
            ]
        }

        event = {
            **api_gw_event,
            "httpMethod": "DELETE",
            "pathParameters": {"id": self.submission_id, "filename": "report.pdf"},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200
        mock_s3.delete_object.assert_called_once()

    @patch("delete_file.app.s3_client")
    def test_not_found_when_file_missing(self, mock_s3, api_gw_event):
        from delete_file.app import lambda_handler

        mock_s3.list_objects_v2.return_value = {"Contents": []}

        event = {
            **api_gw_event,
            "httpMethod": "DELETE",
            "pathParameters": {"id": self.submission_id, "filename": "nonexistent.pdf"},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 404

    def test_not_found_for_missing_submission(self, api_gw_event):
        from delete_file.app import lambda_handler

        event = {
            **api_gw_event,
            "httpMethod": "DELETE",
            "pathParameters": {"id": "nonexistent-id", "filename": "test.pdf"},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 404
