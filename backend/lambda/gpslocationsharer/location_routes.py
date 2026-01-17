import time
from .utils import (
    parse_body,
    format_response,
    python_obj_to_dynamo_obj,
    dynamo_obj_to_python_obj,
    TABLE_NAME,
    GOOGLE_API_KEY,
    dynamo,
)
from .input_validation import (
    validate_schema,
    LOCATION_SHARING_SCHEMA,
    LOCATION_VIEWING_SCHEMA,
    TOKEN_REQUEST_SCHEMA,
)


def share_location_route(event):
    body = validate_schema(parse_body(event["body"]), LOCATION_SHARING_SCHEMA)
    if not body:
        return format_response(
            event=event,
            http_code=403,
            body={"message": "Forbidden"},
        )

    dynamo.put_item(
        TableName=TABLE_NAME,
        Item=python_obj_to_dynamo_obj(
            {
                "key1": str(body["id"]),
                "key2": "location",
                "lat": str(body["lat"]),
                "lon": str(body["lon"]),
                "expiration": int(time.time()) + (60 * 60),
            }
        ),
    )

    return format_response(
        event=event,
        http_code=200,
        body=body["id"],
    )


def view_location_route(event):
    body = validate_schema(parse_body(event["body"]), LOCATION_VIEWING_SCHEMA)
    if not body:
        return format_response(
            event=event,
            http_code=403,
            body={"message": "Forbidden"},
        )

    response = dynamo.get_item(
        TableName=TABLE_NAME,
        Key=python_obj_to_dynamo_obj({"key1": body["id"], "key2": "location", }),
    )

    if "Item" not in response:
        return format_response(
            event=event,
            http_code=404,
            body="Location token not found",
        )

    location_data = dynamo_obj_to_python_obj(response["Item"])

    if "expiration" in location_data and location_data["expiration"] < int(time.time()):
        return format_response(
            event=event,
            http_code=404,
            body="Location token not found",
        )

    return format_response(
        event=event,
        http_code=200,
        body={
            "id": body["id"],
            "lat": location_data["lat"],
            "lon": location_data["lon"],
        },
        log_this=False,
    )


def get_maps_token_route(event):
    body = validate_schema(parse_body(event["body"]), TOKEN_REQUEST_SCHEMA)
    if not body:
        return format_response(
            event=event,
            http_code=403,
            body={"message": "Forbidden"},
        )

    response = dynamo.get_item(
        TableName=TABLE_NAME,
        Key=python_obj_to_dynamo_obj({"key1": body["id"], "key2": "location"}),
    )

    if "Item" not in response:
        return format_response(
            event=event,
            http_code=404,
            body="Location token not found",
        )

    return format_response(
        event=event,
        http_code=200,
        body={"key": GOOGLE_API_KEY},
        log_this=False,
    )
