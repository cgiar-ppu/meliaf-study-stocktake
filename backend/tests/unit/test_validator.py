import pytest
from shared.validator import validate_submission, ValidationError


class TestValidatorRequiredFields:
    def test_valid_submission_passes(self, valid_submission_body):
        result = validate_submission(valid_submission_body)
        assert result == valid_submission_body

    def test_empty_body_fails(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_submission({})
        errors = exc_info.value.errors
        required_fields = {e["field"] for e in errors}
        assert "studyId" in required_fields
        assert "studyTitle" in required_fields
        assert "contactEmail" in required_fields
        assert "studyType" in required_fields

    def test_missing_single_field(self, valid_submission_body):
        del valid_submission_body["studyTitle"]
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "studyTitle" in fields


class TestValidatorEnums:
    def test_invalid_study_type(self, valid_submission_body):
        valid_submission_body["studyType"] = "invalid"
        with pytest.raises(ValidationError):
            validate_submission(valid_submission_body)

    def test_invalid_timing(self, valid_submission_body):
        valid_submission_body["timing"] = "invalid"
        with pytest.raises(ValidationError):
            validate_submission(valid_submission_body)


class TestValidatorCrossField:
    def test_end_date_before_start(self, valid_submission_body):
        valid_submission_body["startDate"] = "2026-06-30"
        valid_submission_body["expectedEndDate"] = "2025-01-15"
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "expectedEndDate" in fields

    def test_funding_source_required_when_funded(self, valid_submission_body):
        valid_submission_body["funded"] = "yes"
        valid_submission_body["fundingSource"] = ""
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "fundingSource" in fields


class TestValidatorYesNoWithLink:
    def test_link_required_when_yes(self, valid_submission_body):
        valid_submission_body["proposalAvailable"] = {"answer": "yes", "link": ""}
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "proposalAvailable.link" in fields

    def test_no_link_needed_when_no(self, valid_submission_body):
        valid_submission_body["proposalAvailable"] = {"answer": "no"}
        # Should not raise
        validate_submission(valid_submission_body)


class TestValidatorW3Bilateral:
    def test_w3bilateral_optional(self, valid_submission_body):
        # w3Bilateral not provided — should pass regardless of center
        valid_submission_body.pop("w3Bilateral", None)
        validate_submission(valid_submission_body)

    def test_w3bilateral_too_long(self, valid_submission_body):
        valid_submission_body["w3Bilateral"] = "x" * 501
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "w3Bilateral" in fields


class TestValidatorRegionsCountries:
    def test_study_regions_optional(self, valid_submission_body):
        valid_submission_body.pop("studyRegions", None)
        validate_submission(valid_submission_body)

    def test_study_regions_accepted(self, valid_submission_body):
        valid_submission_body["studyRegions"] = ["CWANA", "ESA"]
        result = validate_submission(valid_submission_body)
        assert result["studyRegions"] == ["CWANA", "ESA"]

    def test_study_countries_optional(self, valid_submission_body):
        valid_submission_body.pop("studyCountries", None)
        validate_submission(valid_submission_body)

    def test_study_countries_accepted(self, valid_submission_body):
        valid_submission_body["studyCountries"] = ["KE", "TZ", "UG"]
        result = validate_submission(valid_submission_body)
        assert result["studyCountries"] == ["KE", "TZ", "UG"]

    def test_study_regions_invalid_type(self, valid_submission_body):
        valid_submission_body["studyRegions"] = "CWANA"
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "studyRegions" in fields

    def test_study_countries_invalid_items(self, valid_submission_body):
        valid_submission_body["studyCountries"] = [123, 456]
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "studyCountries" in fields


class TestValidatorStringLengths:
    def test_study_title_too_long(self, valid_submission_body):
        valid_submission_body["studyTitle"] = "x" * 501
        with pytest.raises(ValidationError) as exc_info:
            validate_submission(valid_submission_body)
        fields = [e["field"] for e in exc_info.value.errors]
        assert "studyTitle" in fields
