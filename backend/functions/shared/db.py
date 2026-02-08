"""DynamoDB operations for the submissions table."""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr


def _get_table():
    dynamodb = boto3.resource("dynamodb")
    return dynamodb.Table(os.environ["SUBMISSIONS_TABLE"])


def put_submission(item):
    table = _get_table()
    table.put_item(Item=item)
    return item


def get_latest_active_version(submission_id):
    """Get the current active version for a submissionId, or None."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression=Key("submissionId").eq(submission_id),
        FilterExpression=Attr("status").eq("active"),
        ScanIndexForward=False,
        Limit=10,
    )
    items = response.get("Items", [])
    return items[0] if items else None


def list_user_submissions(user_id, status_filter="active"):
    """List submissions for a user via the ByUser GSI, filtered by status."""
    table = _get_table()
    response = table.query(
        IndexName="ByUser",
        KeyConditionExpression=Key("userId").eq(user_id),
        FilterExpression=Attr("status").eq(status_filter),
        ScanIndexForward=False,
    )
    return response.get("Items", [])


def get_version_history(submission_id):
    """Get all versions of a submission, newest first."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression=Key("submissionId").eq(submission_id),
        ScanIndexForward=False,
    )
    return response.get("Items", [])


def mark_superseded(submission_id, version):
    """Mark a specific version as superseded."""
    table = _get_table()
    table.update_item(
        Key={"submissionId": submission_id, "version": version},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "superseded"},
    )
