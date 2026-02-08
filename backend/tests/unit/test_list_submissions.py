import json
from create_submission.app import lambda_handler as create_handler
from list_submissions.app import lambda_handler as list_handler


class TestListSubmissions:
    def test_returns_user_submissions(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create two submissions
        api_gw_event["body"] = json.dumps(valid_submission_body)
        create_handler(api_gw_event, None)
        create_handler(api_gw_event, None)

        # List
        api_gw_event["body"] = None
        response = list_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["count"] == 2
        assert len(body["submissions"]) == 2

    def test_returns_empty_when_none(self, mock_dynamodb, api_gw_event):
        response = list_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["count"] == 0

    def test_filters_by_status(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create a submission (status=active)
        api_gw_event["body"] = json.dumps(valid_submission_body)
        create_handler(api_gw_event, None)

        # Query for archived (should be empty)
        api_gw_event["body"] = None
        api_gw_event["queryStringParameters"] = {"status": "archived"}
        response = list_handler(api_gw_event, None)
        body = json.loads(response["body"])
        assert body["count"] == 0
