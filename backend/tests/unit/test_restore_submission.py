import json
from create_submission.app import lambda_handler as create_handler
from delete_submission.app import lambda_handler as delete_handler
from restore_submission.app import lambda_handler as restore_handler
from shared.db import get_version_history


class TestRestoreSubmission:
    def test_restores_archived_submission(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = create_handler(api_gw_event, None)
        sub_id = json.loads(response["body"])["submissionId"]

        # Delete (archive)
        api_gw_event["pathParameters"] = {"id": sub_id}
        api_gw_event["body"] = None
        response = delete_handler(api_gw_event, None)
        assert response["statusCode"] == 200

        # Restore
        response = restore_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["version"] == 3
        assert body["message"] == "Submission restored successfully"

        # Verify history: v1 superseded, v2 superseded, v3 active
        history = get_version_history(sub_id)
        assert len(history) == 3
        assert history[0]["status"] == "active"
        assert history[0]["version"] == 3
        assert history[1]["status"] == "superseded"
        assert history[1]["version"] == 2
        assert history[2]["status"] == "superseded"
        assert history[2]["version"] == 1

    def test_not_found_when_no_archived_version(self, mock_dynamodb, api_gw_event):
        api_gw_event["pathParameters"] = {"id": "nonexistent-id"}
        response = restore_handler(api_gw_event, None)
        assert response["statusCode"] == 404
