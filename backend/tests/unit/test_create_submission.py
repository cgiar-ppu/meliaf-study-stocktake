import json
from create_submission.app import lambda_handler


class TestCreateSubmission:
    def test_creates_successfully(self, mock_dynamodb, api_gw_event, valid_submission_body):
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = lambda_handler(api_gw_event, None)
        assert response["statusCode"] == 201
        body = json.loads(response["body"])
        assert "submissionId" in body
        assert body["version"] == 1

    def test_rejects_invalid_json(self, api_gw_event):
        api_gw_event["body"] = "not json"
        response = lambda_handler(api_gw_event, None)
        assert response["statusCode"] == 400
        assert "Invalid JSON" in json.loads(response["body"])["error"]

    def test_rejects_missing_fields(self, mock_dynamodb, api_gw_event):
        api_gw_event["body"] = json.dumps({"studyTitle": "Only title"})
        response = lambda_handler(api_gw_event, None)
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "details" in body
        assert len(body["details"]) > 0

    def test_rejects_invalid_enum(self, mock_dynamodb, api_gw_event, valid_submission_body):
        valid_submission_body["studyType"] = "invalid_type"
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = lambda_handler(api_gw_event, None)
        assert response["statusCode"] == 400

    def test_has_cors_headers(self, mock_dynamodb, api_gw_event, valid_submission_body):
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = lambda_handler(api_gw_event, None)
        assert response["headers"]["Access-Control-Allow-Origin"] == "*"
