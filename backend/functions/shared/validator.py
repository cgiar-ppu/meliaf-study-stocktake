"""Server-side validation mirroring the Zod schema in src/lib/formSchema.ts."""

import re
from shared.constants import (
    VALID_STUDY_TYPES, VALID_TIMINGS, VALID_ANALYTICAL_SCOPES,
    VALID_GEOGRAPHIC_SCOPES, VALID_RESULT_LEVELS, VALID_CAUSALITY_MODES,
    VALID_METHOD_CLASSES, VALID_STATUS_TYPES, VALID_FUNDED_TYPES,
    VALID_YES_NO_NA, VALID_PRIMARY_USER_TYPES,
    SECTION_C_CAUSALITY_MODES, SECTION_C_METHOD_CLASSES,
    MAX_STUDY_ID, MAX_STUDY_TITLE, MAX_LEAD_CENTER, MAX_CONTACT_NAME,
    MAX_PRIMARY_INDICATOR, MAX_RESEARCH_QUESTIONS, MAX_STUDY_INDICATORS,
    MAX_FUNDING_SOURCE, MAX_COMMISSIONING_SOURCE,
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
URL_RE = re.compile(r"^https?://\S+$")


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__(f"Validation failed: {len(errors)} error(s)")


def validate_submission(data):
    """Validate submission data. Returns data on success, raises ValidationError on failure."""
    errors = []

    # --- Section A: Basic Information ---
    _require_string(data, "studyId", MAX_STUDY_ID, errors)
    _require_string(data, "studyTitle", MAX_STUDY_TITLE, errors)
    _require_string(data, "leadCenter", MAX_LEAD_CENTER, errors)
    _require_string(data, "contactName", MAX_CONTACT_NAME, errors)
    _require_email(data, "contactEmail", errors)
    _require_string_array(data, "otherCenters", 1, errors)

    # --- Section B: Study Classification ---
    _require_enum(data, "studyType", VALID_STUDY_TYPES, errors)
    _require_enum(data, "timing", VALID_TIMINGS, errors)
    _require_enum(data, "analyticalScope", VALID_ANALYTICAL_SCOPES, errors)
    _require_enum(data, "geographicScope", VALID_GEOGRAPHIC_SCOPES, errors)
    _require_enum(data, "resultLevel", VALID_RESULT_LEVELS, errors)
    _require_enum(data, "causalityMode", VALID_CAUSALITY_MODES, errors)
    _require_enum(data, "methodClass", VALID_METHOD_CLASSES, errors)
    _require_string(data, "primaryIndicator", MAX_PRIMARY_INDICATOR, errors)

    # --- Section C: Research Details (validate types/lengths if present) ---
    _optional_string(data, "keyResearchQuestions", MAX_RESEARCH_QUESTIONS, errors)
    _optional_string(data, "unitOfAnalysis", 200, errors)
    _optional_string(data, "treatmentIntervention", 500, errors)
    _optional_positive_int(data, "sampleSize", errors)
    _optional_enum(data, "powerCalculation", VALID_YES_NO_NA, errors)
    _optional_string_array(data, "dataCollectionMethods", errors)
    _optional_string(data, "studyIndicators", MAX_STUDY_INDICATORS, errors)
    _optional_yes_no_with_link(data, "preAnalysisPlan", errors)
    _optional_positive_int(data, "dataCollectionRounds", errors)

    # --- Section D: Timeline & Status ---
    _require_date(data, "startDate", errors)
    _require_date(data, "expectedEndDate", errors)
    _require_enum(data, "dataCollectionStatus", VALID_STATUS_TYPES, errors)
    _require_enum(data, "analysisStatus", VALID_STATUS_TYPES, errors)
    start = data.get("startDate", "")
    end = data.get("expectedEndDate", "")
    if start and end and end < start:
        errors.append({"field": "expectedEndDate", "message": "End date must be on or after start date"})

    # --- Section E: Funding & Resources ---
    _require_enum(data, "funded", VALID_FUNDED_TYPES, errors)
    funded = data.get("funded", "")
    if funded in ("yes", "partial"):
        fs = data.get("fundingSource")
        if not fs or not str(fs).strip():
            errors.append({"field": "fundingSource", "message": "Required when funded is yes or partial"})
    _optional_string(data, "fundingSource", MAX_FUNDING_SOURCE, errors)
    _optional_positive_number(data, "totalCostUSD", errors)
    _require_yes_no_with_link(data, "proposalAvailable", errors)

    # --- Section F: Outputs & Users ---
    _require_yes_no_with_link(data, "manuscriptDeveloped", errors)
    _require_yes_no_with_link(data, "policyBriefDeveloped", errors)
    _require_yes_no_with_link(data, "relatedToPastStudy", errors)
    _require_enum_array(data, "intendedPrimaryUser", VALID_PRIMARY_USER_TYPES, 1, errors)
    _require_string(data, "commissioningSource", MAX_COMMISSIONING_SOURCE, errors)

    if errors:
        raise ValidationError(errors)

    return data


# --- Helpers ---

def _require_string(data, field, max_len, errors):
    val = data.get(field)
    if not val or not isinstance(val, str) or not val.strip():
        errors.append({"field": field, "message": f"{field} is required"})
    elif len(val) > max_len:
        errors.append({"field": field, "message": f"{field} must be at most {max_len} characters"})


def _require_email(data, field, errors):
    val = data.get(field)
    if not val or not isinstance(val, str) or not val.strip():
        errors.append({"field": field, "message": f"{field} is required"})
    elif not EMAIL_RE.match(val):
        errors.append({"field": field, "message": f"{field} must be a valid email"})


def _require_enum(data, field, valid_values, errors):
    val = data.get(field)
    if not val:
        errors.append({"field": field, "message": f"{field} is required"})
    elif val not in valid_values:
        errors.append({"field": field, "message": f"{field} must be one of: {', '.join(sorted(valid_values))}"})


def _require_date(data, field, errors):
    val = data.get(field)
    if not val or not isinstance(val, str) or not val.strip():
        errors.append({"field": field, "message": f"{field} is required"})
        return
    if not re.match(r"^\d{4}-\d{2}-\d{2}", val):
        errors.append({"field": field, "message": f"{field} must be a valid date (YYYY-MM-DD)"})


def _require_string_array(data, field, min_length, errors):
    val = data.get(field)
    if not isinstance(val, list) or len(val) < min_length:
        errors.append({"field": field, "message": f"{field} must have at least {min_length} item(s)"})
    elif not all(isinstance(v, str) and v.strip() for v in val):
        errors.append({"field": field, "message": f"{field} items must be non-empty strings"})


def _require_enum_array(data, field, valid_values, min_length, errors):
    val = data.get(field)
    if not isinstance(val, list) or len(val) < min_length:
        errors.append({"field": field, "message": f"{field} must have at least {min_length} item(s)"})
    elif not all(v in valid_values for v in val):
        errors.append({"field": field, "message": f"{field} contains invalid values"})


def _require_yes_no_with_link(data, field, errors):
    val = data.get(field)
    if not isinstance(val, dict):
        errors.append({"field": field, "message": f"{field} is required"})
        return
    answer = val.get("answer")
    if answer not in ("yes", "no"):
        errors.append({"field": field, "message": f"{field}.answer must be 'yes' or 'no'"})
        return
    if answer == "yes":
        link = val.get("link", "")
        if not link or not str(link).strip():
            errors.append({"field": f"{field}.link", "message": f"Link is required when {field} is yes"})
        elif not URL_RE.match(link):
            errors.append({"field": f"{field}.link", "message": f"{field} link must be a valid URL"})


def _optional_string(data, field, max_len, errors):
    val = data.get(field)
    if val is not None and isinstance(val, str) and len(val) > max_len:
        errors.append({"field": field, "message": f"{field} must be at most {max_len} characters"})


def _optional_enum(data, field, valid_values, errors):
    val = data.get(field)
    if val is not None and val not in valid_values:
        errors.append({"field": field, "message": f"{field} must be one of: {', '.join(sorted(valid_values))}"})


def _optional_positive_int(data, field, errors):
    val = data.get(field)
    if val is not None:
        try:
            n = int(val)
            if n <= 0:
                errors.append({"field": field, "message": f"{field} must be a positive integer"})
        except (ValueError, TypeError):
            errors.append({"field": field, "message": f"{field} must be a positive integer"})


def _optional_positive_number(data, field, errors):
    val = data.get(field)
    if val is not None:
        try:
            n = float(val)
            if n <= 0:
                errors.append({"field": field, "message": f"{field} must be a positive number"})
        except (ValueError, TypeError):
            errors.append({"field": field, "message": f"{field} must be a positive number"})


def _optional_string_array(data, field, errors):
    val = data.get(field)
    if val is not None:
        if not isinstance(val, list):
            errors.append({"field": field, "message": f"{field} must be an array"})
        elif not all(isinstance(v, str) for v in val):
            errors.append({"field": field, "message": f"{field} items must be strings"})


def _optional_yes_no_with_link(data, field, errors):
    val = data.get(field)
    if val is not None:
        _require_yes_no_with_link(data, field, errors)
