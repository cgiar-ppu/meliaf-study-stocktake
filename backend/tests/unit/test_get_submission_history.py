import json
from create_submission.app import lambda_handler as create_handler
from update_submission.app import lambda_handler as update_handler
from get_submission_history.app import lambda_handler as history_handler


class TestGetSubmissionHistory:
    def test_returns_all_versions(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = create_handler(api_gw_event, None)
        sub_id = json.loads(response["body"])["submissionId"]

        # Update
        valid_submission_body["studyTitle"] = "Updated Title"
        api_gw_event["pathParameters"] = {"id": sub_id}
        api_gw_event["body"] = json.dumps(valid_submission_body)
        update_handler(api_gw_event, None)

        # Get history
        api_gw_event["body"] = None
        response = history_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["count"] == 2
        # Newest first
        assert body["versions"][0]["version"] == 2
        assert body["versions"][1]["version"] == 1

    def test_not_found(self, mock_dynamodb, api_gw_event):
        api_gw_event["pathParameters"] = {"id": "nonexistent-id"}
        response = history_handler(api_gw_event, None)
        assert response["statusCode"] == 404
