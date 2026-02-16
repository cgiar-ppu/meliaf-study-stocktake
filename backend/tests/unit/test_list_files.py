"""Tests for list_files Lambda handler."""

import json
import os
import pytest
from unittest.mock import patch


os.environ["FILES_BUCKET"] = "test-files-bucket"


class TestListFiles:
    @pytest.fixture(autouse=True)
    def setup(self, mock_dynamodb, api_gw_event, valid_submission_body):
        from create_submission.app import lambda_handler as create_handler
        from shared.db import get_latest_active_version

        event = {**api_gw_event, "httpMethod": "POST", "body": json.dumps(valid_submission_body)}
        result = json.loads(create_handler(event, None)["body"])
        self.submission_id = result["submissionId"]
        # Get the actual createdAt to build correct S3 prefix
        sub = get_latest_active_version(self.submission_id)
        self.created_at = str(sub["createdAt"])[:10]
        self.prefix = f"{self.created_at}_{self.submission_id}/files/"

    @patch("list_files.app.s3_client")
    def test_lists_files(self, mock_s3, api_gw_event):
        from list_files.app import lambda_handler

        mock_s3.list_objects_v2.return_value = {
            "Contents": [
                {"Key": f"{self.prefix}abc12345_report.pdf", "Size": 1024},
                {"Key": f"{self.prefix}def67890_data.xlsx", "Size": 2048},
            ]
        }
        mock_s3.generate_presigned_url.return_value = "https://s3.amazonaws.com/download-url"

        event = {
            **api_gw_event,
            "httpMethod": "GET",
            "pathParameters": {"id": self.submission_id},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["files"]) == 2
        assert body["files"][0]["filename"] == "report.pdf"
        assert body["files"][1]["filename"] == "data.xlsx"
        assert body["files"][0]["size"] == 1024

    @patch("list_files.app.s3_client")
    def test_empty_file_list(self, mock_s3, api_gw_event):
        from list_files.app import lambda_handler

        mock_s3.list_objects_v2.return_value = {}

        event = {
            **api_gw_event,
            "httpMethod": "GET",
            "pathParameters": {"id": self.submission_id},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["files"] == []

    def test_not_found_for_missing_submission(self, api_gw_event):
        from list_files.app import lambda_handler

        event = {
            **api_gw_event,
            "httpMethod": "GET",
            "pathParameters": {"id": "nonexistent-id"},
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 404
