import json
import sys
from datetime import datetime, timezone

class DRHLoader:
    """
    Generalized Loader for the DRH Protocol.
    Formatted messages are emitted to stdout in the Singer pattern.
    """
    def __init__(self):
        pass

    def emit_schema(self, stream_name, schema, key_properties=None):
        """Emits a Singer-compliant SCHEMA message."""
        msg = {
            "type": "SCHEMA",
            "stream": stream_name,
            "schema": schema,
            "key_properties": key_properties or [],
            "emitted_at": datetime.now(timezone.utc).isoformat()
        }
        self._write(msg)

    def emit_record(self, stream_name, record):
        """Emits a Singer-compliant RECORD message."""
        msg = {
            "type": "RECORD",
            "stream": stream_name,
            "record": record,
            "emitted_at": datetime.now(timezone.utc).isoformat()
        }
        self._write(msg)

    def emit_state(self, state):
        """Emits a Singer-compliant STATE message."""
        msg = {
            "type": "STATE",
            "value": state,
            "emitted_at": datetime.now(timezone.utc).isoformat()
        }
        self._write(msg)

    def _write(self, message):
        """Standardizes the output to stdout for capture."""
        sys.stdout.write(json.dumps(message) + '\n')
        sys.stdout.flush()