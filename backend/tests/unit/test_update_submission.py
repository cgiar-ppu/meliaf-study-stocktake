import json
from create_submission.app import lambda_handler as create_handler
from update_submission.app import lambda_handler as update_handler


def _create_submission(api_gw_event, valid_submission_body):
    """Helper: create a submission and return its ID."""
    api_gw_event["body"] = json.dumps(valid_submission_body)
    response = create_handler(api_gw_event, None)
    return json.loads(response["body"])["submissionId"]


class TestUpdateSubmission:
    def test_increments_version(self, mock_dynamodb, api_gw_event, valid_submission_body):
        sub_id = _create_submission(api_gw_event, valid_submission_body)

        valid_submission_body["studyTitle"] = "Updated Title"
        api_gw_event["pathParameters"] = {"id": sub_id}
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = update_handler(api_gw_event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["version"] == 2
        assert body["submissionId"] == sub_id

    def test_not_found(self, mock_dynamodb, api_gw_event, valid_submission_body):
        api_gw_event["pathParameters"] = {"id": "nonexistent-id"}
        api_gw_event["body"] = json.dumps(valid_submission_body)
        response = update_handler(api_gw_event, None)
        assert response["statusCode"] == 404

    def test_rejects_invalid_body(self, mock_dynamodb, api_gw_event, valid_submission_body):
        sub_id = _create_submission(api_gw_event, valid_submission_body)
        api_gw_event["pathParameters"] = {"id": sub_id}
        api_gw_event["body"] = json.dumps({"studyTitle": "Only title"})
        response = update_handler(api_gw_event, None)
        assert response["statusCode"] == 400
