import json
from create_submission.app import lambda_handler as create_handler
from list_all_submissions.app import lambda_handler as list_all_handler


class TestListAllSubmissions:
    def test_returns_submissions_from_multiple_users(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create submission from user A (default dev user)
        api_gw_event["body"] = json.dumps(valid_submission_body)
        create_handler(api_gw_event, None)

        # Create submission from user B
        event_b = {**api_gw_event, "requestContext": {
            "authorizer": {"claims": {"sub": "user-b", "email": "b@cgiar.org"}}
        }}
        event_b["body"] = json.dumps({**valid_submission_body, "studyTitle": "User B Study"})
        create_handler(event_b, None)

        # List all — should see both
        api_gw_event["body"] = None
        response = list_all_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["count"] == 2
        user_ids = {s["userId"] for s in body["submissions"]}
        assert len(user_ids) == 2

    def test_returns_empty_when_none(self, mock_dynamodb, api_gw_event):
        response = list_all_handler(api_gw_event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["count"] == 0
        assert body["submissions"] == []

    def test_filters_by_status(self, mock_dynamodb, api_gw_event, valid_submission_body):
        # Create a submission (status=active)
        api_gw_event["body"] = json.dumps(valid_submission_body)
        create_handler(api_gw_event, None)

        # Query for archived (should be empty)
        api_gw_event["body"] = None
        api_gw_event["queryStringParameters"] = {"status": "archived"}
        response = list_all_handler(api_gw_event, None)
        body = json.loads(response["body"])
        assert body["count"] == 0

        # Query for active (should find 1)
        api_gw_event["queryStringParameters"] = {"status": "active"}
        response = list_all_handler(api_gw_event, None)
        body = json.loads(response["body"])
        assert body["count"] == 1
