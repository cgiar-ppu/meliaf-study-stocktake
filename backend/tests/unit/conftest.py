import sys
import os
import json
import pytest

# Add functions/ to path so "from shared..." imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "functions"))

# Set required env vars before any handler imports
os.environ["SUBMISSIONS_TABLE"] = "test-submissions"
os.environ["USERS_TABLE"] = "test-users"
os.environ["ALLOWED_EMAIL_DOMAINS"] = "cgiar.org,synapsis-analytics.com"
os.environ["ENVIRONMENT"] = "test"
os.environ["LOG_LEVEL"] = "DEBUG"
os.environ["AWS_DEFAULT_REGION"] = "eu-central-1"
os.environ["FRONTEND_URL"] = "http://localhost:8080"
os.environ["CONFIRM_SIGNUP_URL"] = "https://test-confirm.lambda-url.eu-central-1.on.aws/"
os.environ["USER_POOL_CLIENT_ID"] = "test-client-id-123"


@pytest.fixture
def api_gw_event():
    """Base API Gateway proxy event template."""
    return {
        "httpMethod": "GET",
        "path": "/submissions",
        "headers": {"Content-Type": "application/json"},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": None,
        "requestContext": {},
    }


@pytest.fixture
def mock_dynamodb():
    """Create a mocked DynamoDB table matching the SAM template."""
    from moto import mock_aws

    with mock_aws():
        import boto3
        client = boto3.client("dynamodb", region_name="eu-central-1")
        client.create_table(
            TableName="test-submissions",
            KeySchema=[
                {"AttributeName": "submissionId", "KeyType": "HASH"},
                {"AttributeName": "version", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "submissionId", "AttributeType": "S"},
                {"AttributeName": "version", "AttributeType": "N"},
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "ByUser",
                    "KeySchema": [
                        {"AttributeName": "userId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "ByStatus",
                    "KeySchema": [
                        {"AttributeName": "status", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield


@pytest.fixture
def mock_users_dynamodb():
    """Create a mocked DynamoDB Users table."""
    from moto import mock_aws

    with mock_aws():
        import boto3
        client = boto3.client("dynamodb", region_name="eu-central-1")
        client.create_table(
            TableName="test-users",
            KeySchema=[
                {"AttributeName": "userId", "KeyType": "HASH"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield


@pytest.fixture
def valid_submission_body():
    """A valid submission payload for testing."""
    return {
        "studyId": "TEST-001",
        "studyTitle": "Test Study Title",
        "leadCenter": "CIAT",
        "contactName": "Jane Doe",
        "contactEmail": "jane@cgiar.org",
        "otherCenters": ["IFPRI", "IITA"],
        "studyType": "causal_impact",
        "timing": "t2_endline",
        "analyticalScope": "project_intervention",
        "geographicScope": "national",
        "resultLevel": "outcome",
        "causalityMode": "c2_causal",
        "methodClass": "experimental_quasi",
        "primaryIndicator": "Crop yield improvement",
        "startDate": "2025-01-15",
        "expectedEndDate": "2026-06-30",
        "dataCollectionStatus": "ongoing",
        "analysisStatus": "planned",
        "funded": "yes",
        "fundingSource": "Bill & Melinda Gates Foundation",
        "totalCostUSD": 250000,
        "proposalAvailable": {"answer": "yes", "link": "https://example.com/proposal"},
        "manuscriptDeveloped": {"answer": "no"},
        "policyBriefDeveloped": {"answer": "no"},
        "relatedToPastStudy": {"answer": "no"},
        "intendedPrimaryUser": ["program", "donor"],
        "commissioningSource": "CGIAR System Board",
    }
