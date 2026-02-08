"""User identity extraction. Hardcoded dev user now; swap to JWT claims when Cognito is added."""

DEV_USER = {
    "user_id": "dev-user-001",
    "email": "developer@cgiar.org",
}


def get_user_identity(event):
    """Extract user identity from the API Gateway event.

    Currently returns a hardcoded dev user matching the frontend AuthContext mock.
    When Cognito is added, switch to:
        claims = event['requestContext']['authorizer']['claims']
        return {'user_id': claims['sub'], 'email': claims['email']}
    """
    return DEV_USER
