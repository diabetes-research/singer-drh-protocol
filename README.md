# DRH Singer Protocol

**A standardized data integration protocol for Diabetes Research Hub using Singer specification and OpenTelemetry observability**

[![Singer Specification](https://img.shields.io/badge/Singer-v0.3.0-blue)](https://github.com/singer-io/getting-started)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-1.0-orange)](https://opentelemetry.io/)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8+-green)](https://www.python.org/)

---

## Table of Contents

- [What is Singer?](#what-is-singer)
- [OpenTelemetry Schema and Validation Logging](#opentelemetry-schema-and-validation-logging)
- [Interactive Schema Visualization](#interactive-schema-visualization)
- [Data Preparation for Researchers](#data-preparation-for-researchers)
- [Python Implementation Guide](#python-implementation-guide)
- [Installation](#installation)
  
---

## What is Singer?

**Singer** is an open-source standard for moving data between systems using a JSON-based format. The specification defines how data extraction scripts (called **Taps**) and data loading scripts (called **Targets**) communicate, enabling any source to connect to any destination in a standardized, composable manner.

### Core Concepts

Singer operates through a simple pipeline architecture:

![singerpipeline](/drh-target/assets/singer-pipeline.png)

#### **Taps (Data Extractors)**

Taps extract data from any source and write it to standard output (stdout) in a JSON-based format. In the DRH context, taps read medical research data from various formats (CSV, Excel, APIs) and validate against the DRH schema.

#### **Targets (Data Loaders)**

Targets consume data from taps and load it into destinations like databases, files, or APIs. For DRH, targets typically load validated data into SQLite databases for analysis and visualization.

### The Three Singer Message Types

Singer uses three standardized JSON message types that flow through the pipeline:

#### 1. **SCHEMA Messages**

Define the structure and data types of records. Each stream (e.g., `participant`, `author`, `study`) has a schema that specifies:

- Field names and types
- Required vs. optional fields
- Data format patterns (dates, emails, IDs)
- Validation constraints

**Example:**

```json
{
  "type": "SCHEMA",
  "stream": "participant",
  "schema": {
    "type": "object",
    "properties": {
      "participant_id": {"type": "string"},
      "study_id": {"type": "string"},
      "age": {"type": "integer"},
      "gender": {"type": "string"},
      "diagnosis_date": {"type": "string", "format": "date"}
    },
    "required": ["participant_id", "study_id"]
  },
  "key_properties": ["participant_id"]
}
```

#### 2. **RECORD Messages**

Contain the actual data being transferred. Each record corresponds to one row of data and must conform to its stream's schema.

**Example:**

```json
{
  "type": "RECORD",
  "stream": "participant",
  "record": {
    "participant_id": "P001",
    "study_id": "S001",
    "age": 45,
    "gender": "F",
    "diagnosis_date": "2024-01-15"
  },
  "time_extracted": "2024-02-06T10:30:00Z"
}
```

#### 3. **STATE Messages**

Track the progress of data extraction to enable incremental updates and resumable processing. If a tap is interrupted, it can resume from the last saved state.

**Example:**

```json
{
  "type": "STATE",
  "value": {
    "last_processed_file": "cgm_tracing_2024-01-15.csv",
    "last_timestamp": "2024-01-15T23:59:59Z",
    "records_processed": 1247
  }
}
```

### Why Singer for Medical Research?

The DRH Protocol leverages Singer because it provides:

✅ **Standardization**: Consistent data format across different research sites and devices  
✅ **Composability**: Mix and match taps and targets (e.g., CSV → SQLite, API → Postgres)  
✅ **Language Agnostic**: Programs written in any language can conform to the Singer specification  
✅ **Simplicity**: No daemons or complicated plugins needed—just simple pipes  
✅ **Reusability**: Share validated taps across research projects  
✅ **FAIR Principles**: Makes data Findable, Accessible, Interoperable, and Reusable

### Official Singer Documentation

- **Getting Started Guide**: [https://github.com/singer-io/getting-started](https://github.com/singer-io/getting-started)
- **Singer Specification**: [https://hub.meltano.com/singer/spec/](https://hub.meltano.com/singer/spec/)
- **Singer.io Homepage**: [https://www.singer.io/](https://www.singer.io/)
- **MeltanoHub (Tap/Target Directory)**: [https://hub.meltano.com/](https://hub.meltano.com/)

---

## OpenTelemetry Schema and Validation Logging

The DRH Protocol integrates **OpenTelemetry (OTel)** to provide comprehensive observability and validation tracking. While Singer handles data movement, OpenTelemetry captures the validation and quality assurance process.

### What is OpenTelemetry?

OpenTelemetry is an observability framework that provides three types of telemetry data:

![open-telemetry](/drh-target/assets/open-telemetry.png)

### How DRH Uses OpenTelemetry

When data is processed through a DRH Singer tap, every validation step is tracked using OpenTelemetry:

#### **OpenTelemetry Naming Convention**

The DRH tap uses a structured naming system for observability:

![observability](/drh-target/assets/observability.png)

#### **1. Traces (Validation Workflow)**

Traces show the complete journey of data through the validation pipeline:

![trace-validation-flow](/drh-target/assets/trace-validation-flow.png)

Each span records:

- Start and end timestamps
- Validation status (OK, ERROR, WARNING)
- Attributes (file name, row count, error count)
- Parent-child relationships

#### **2. Logs (Validation Events)**

Whenever data fails to meet schema requirements, a structured log event is emitted:

**Example validation failure:**

```json
{
  "timestamp": "2024-02-06T10:32:15.234Z",
  "severity": "ERROR",
  "body": "Missing required field: participant_id",
  "attributes": {
    "stream": "participant",
    "file": "participants.csv",
    "row": 42,
    "validation_check": "required_fields",
    "trace_id": "abc123def456",
    "span_id": "span789"
  }
}
```

This allows researchers to:

- Identify exactly which records failed validation
- Understand why validation failed (missing field, wrong type, invalid format)
- Trace the error back to the source file and row
- Fix data quality issues before database ingestion

#### **3. Metrics (Data Quality Indicators)**

Metrics provide aggregate statistics about validation results:

```
Validation Metrics (from OTel):
├─ vv.files.processed_count: 8
├─ vv.validation.pass_count: 6 checks
├─ vv.validation.fail_count: 2 checks
├─ vv.validation.duration: 5.2 seconds
│
Per-Check Metrics:
├─ Check 1 (Folder Scan): pass_count=1, duration=0.1s
├─ Check 2 (Mandatory Files): pass_count=1, duration=0.05s
├─ Check 3 (Extensions): pass_count=1, duration=0.02s
├─ Check 4 (Schema): pass_count=0, fail_count=2, duration=2.3s
├─ Check 5 (CGM Metadata): pass_count=1, duration=0.3s
└─ Check 6 (CGM Integrity): pass_count=1, duration=1.5s
```

### Validation Workflow with OTel

Here's how validation logging works in practice:

```python
# DRH tap reads a CSV row
row = {"participant_id": "P001", "age": "invalid"}

# Validation against schema
try:
    validate_data_type(row, schema)
except ValidationError as e:
    # Emit OTel log
    emit_otel_log(
        severity="ERROR",
        message=f"Type validation failed: {e}",
        attributes={
            "stream": "participant",
            "field": "age",
            "expected_type": "integer",
            "actual_value": "invalid",
            "row": row
        }
    )
    # Skip record (or handle based on config)
    return
```

### Benefits for Medical Researchers

OpenTelemetry validation logging provides:

✅ **Full Audit Trail**: Every validation decision is recorded  
✅ **Regulatory Compliance**: Meet data governance requirements (HIPAA, GDPR)  
✅ **Data Quality Dashboard**: Visualize validation metrics over time  
✅ **Root Cause Analysis**: Trace errors back to source files and rows  
✅ **Reproducibility**: Validation logs enable exact replay of data processing  
✅ **Collaborative Debugging**: Share validation reports with data providers

---

## Interactive Schema Visualization

The DRH Protocol schemas are complex, with nested structures and relationships. We provide **interactive visualizations** using [JSON Crack](https://jsoncrack.com/) to help researchers explore schema definitions visually.

### What is JSON Crack?

JSON Crack is an open-source online tool that renders JSON schemas as interactive tree-graph diagrams. You can:

- ✅ Expand/collapse nested structures  
- ✅ See field types and constraints at a glance  
- ✅ Navigate relationships between schemas  
- ✅ Export visualizations as PNG, JPEG, or SVG  
- ✅ Share links with collaborators  

### Magic Links to Schema Visualizations

Click any link below to open an **interactive, dynamic visualization** of the schema. These links load schemas directly from GitHub's raw content, so they automatically update when schema files change.

> **Note**: Links open JSON Crack with the schema pre-loaded. If a visualization doesn't appear, the schema file may not exist yet in the repository, or you may need to manually paste the raw GitHub URL into [jsoncrack.com/editor](https://jsoncrack.com/editor).

#### Core Research Data Schemas

| Stream | Description | Interactive Visualization |
|--------|-------------|---------------------------|
| **Study** | Research study metadata | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/study.json) |
| **Participant** | Subject demographics and baseline data | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/participant.json) |
| **Investigator** | Principal investigators and co-investigators | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/investigator.json) |
| **Author** | Study authors and contributors | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/author.json) |
| **Institution** | Research institutions and affiliations | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/institution.json) |
| **Lab** | Laboratory information | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/lab.json) |
| **Site** | Clinical trial sites | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/site.json) |
| **Publication** | Related publications and references | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/publication.json) |

#### CGM Data Schemas

| Stream | Description | Interactive Visualization |
|--------|-------------|---------------------------|
| **CGM File Metadata** | Continuous glucose monitoring file descriptors | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/cgm_file_metadata.json) |
| **CGM Tracing** | Raw CGM glucose readings (time-series data) | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/cgm_tracing.json) |

#### Meal Data Schemas

| Stream | Description | Interactive Visualization |
|--------|-------------|---------------------------|
| **Meal File Metadata** | Meal logging file descriptors | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/meal_file_metadata.json) |
| **Meal** | Meal composition and timing | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/meal.json) |

#### Fitness Data Schemas

| Stream | Description | Interactive Visualization |
|--------|-------------|---------------------------|
| **Fitness File Metadata** | Physical activity file descriptors | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/fitness_file_metadata.json) |
| **Fitness** | Exercise and activity logs | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/fitness.json) |

#### OpenTelemetry Schemas

Schemas for observability and validation tracking:

| Stream | Description | Interactive Visualization |
|--------|-------------|---------------------------|
| **OTel Span** | Distributed trace spans for validation tracking | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/otel_span.json) |
| **OTel Log** | Structured log events for validation errors | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/otel_log.json) |
| **OTel Metric** | Performance and data quality metrics | [🔗 View Schema](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/otel_metric.json) |

### How to Use the Visualizations

1. **Click a schema link** above to open it in JSON Crack
2. **Explore the tree structure**:
   - Click nodes to expand/collapse
   - Hover over fields to see types and descriptions
   - Use zoom and pan to navigate large schemas
3. **Understand relationships**:
   - Look for `foreign_key` annotations
   - See which fields are `required` vs. optional
   - Identify `enum` constraints for categorical data
4. **Share with collaborators**:
   - Copy the URL to share visualizations
   - Links always reflect the latest schema version

### Example: Exploring the Participant Schema

The participant schema includes:

- **Required Fields**: `participant_id`, `study_id`
- **Demographic Data**: `age`, `gender`, `ethnicity`, `race`
- **Clinical Data**: `diagnosis_date`, `diagnosis_type`, `diabetes_duration`
- **Foreign Keys**: `study_id` → `study.study_id`, `site_id` → `site.site_id`
- **Enum Constraints**: `gender` ∈ {M, F, Other, Unknown}

[**🔗 Explore Participant Schema Interactively**](https://jsoncrack.com/editor?json=https://raw.githubusercontent.com/diabetes-research/singer-drh-protocol/main/drh-target/python-pkg/src/drh_target/schemas/participant.json)

---

## Data Preparation for Researchers

Medical researchers can prepare their data for the DRH pipeline regardless of the source format. The DRH Singer Protocol is flexible and extensible.

### Data Source Formats

#### Currently Tested and Supported

The DRH protocol has been **validated and tested** with:

| Format | Status | Description | Example Use Case |
|--------|--------|-------------|------------------|
| **CSV** | ✅ **Production Ready** | Comma-separated values | CGM exports, participant demographics, meal logs, fitness data |

**Reference Implementation**: The sample tap in the [drh-edge repository](https://github.com/diabetes-research/spry-drh-edge-platform/) demonstrates complete CSV processing with all 10 validation checks.Refer the folder `drh-edge-core/singer-tap`.

#### Theoretically Supported (Untested)

The Singer specification and DRH protocol architecture are designed to support any data format as a source. The following formats *should* work but **have not been tested or validated** by the DRH team:

| Format | Theoretical Support | Potential Use Case | Implementation Required |
|--------|---------------------|---------------------|-------------------------|
| **Excel** | 🟡 Possible | Study metadata, manual meal logs | Write tap using `openpyxl` or `pandas` to read .xlsx/.xls files |
| **JSON** | 🟡 Possible | API responses from medical devices | Parse JSON and map to DRH schema fields |
| **XML** | 🟡 Possible | HL7, FHIR clinical data interchange | Parse with `xml.etree` or `lxml`, transform to DRH format |
| **RESTful APIs** | 🟡 Possible | Real-time CGM data from cloud platforms | HTTP client to fetch data, convert to Singer messages |
| **SQL Databases** | 🟡 Possible | Legacy research databases (MySQL, PostgreSQL) | SQL queries to extract, validate against DRH schema |
| **NoSQL Databases** | 🟡 Possible | Document stores (MongoDB, DynamoDB) | Query documents, map to relational DRH schema |

**Key Principle**: The Singer specification is format-agnostic. As long as you can write a tap that:

1. Reads your source format
2. Validates data against DRH schemas
3. Emits standard Singer messages (SCHEMA, RECORD, STATE)

It will integrate with the DRH ecosystem. However, **each new format requires custom tap development and validation testing**.

#### Developing Taps for New Formats

If you need to process formats other than CSV:

**1:Assess Feasibility**

- Can you programmatically read the format in Python?
- Can you map the source fields to DRH schema fields?
- Is the data structured or unstructured?

**2:Create a Custom Tap**

- Copy the CSV tap as a template
- Replace the CSV reading logic with your format's reader
- Keep the DRH schema validation and OpenTelemetry tracking
- Test thoroughly with sample data

#### Recommendations

For new DRH implementations:

✅ **Use CSV format** - Proven, tested, reliable  
✅ **Export from other formats to CSV** - Most tools (Excel, databases, APIs) can export to CSV  
⚠️ **Custom formats require development** - Budget time for tap development and testing  
⚠️ **Validate thoroughly** - Run the full 10-step validation pipeline on sample data before production use

### Understanding the DRH Schema

The DRH schema defines the structure and validation rules for diabetes research data. It is organized into **streams** (data tables), each with:

- **Field definitions** (name, type, description)
- **Required fields** (mandatory for valid records)
- **Data types** (string, integer, number, date, boolean)
- **Format patterns** (date formats, email regex, ID structures)
- **Enum constraints** (allowed categorical values)
- **Foreign key relationships** (cross-table references)

#### Core DRH Streams

| Stream | Description | Required Fields |
|--------|-------------|-----------------|
| `study` | Research study metadata | study_id, study_name, start_date |
| `participant` | Subject demographics | participant_id, study_id, age, gender |
| `investigator` | Principal investigators | investigator_id, name, email, institution_id |
| `author` | Study authors | author_id, name, study_id |
| `institution` | Research institutions | institution_id, name, country |
| `lab` | Laboratory information | lab_id, lab_name, institution_id |
| `site` | Clinical sites | site_id, site_name, study_id |
| `cgm_file_metadata` | CGM file descriptors | file_name, patient_id, device_name, start_date, end_date |
| `cgm_tracing` | Raw CGM glucose readings | timestamp, glucose_value, patient_id |
| `meal_file_metadata` | Meal log descriptors | file_name, patient_id, meal_count |
| `meal` | Meal logging data | timestamp, meal_type, patient_id |
| `fitness_file_metadata` | Activity data descriptors | file_name, patient_id, activity_count |
| `fitness` | Exercise and activity logs | timestamp, activity_type, duration, patient_id |

### Writing Your Own Singer Tap

To integrate a new data source, you'll create a custom Singer tap that:

1. **Reads your data format** (CSV, Excel, API, etc.)
2. **Validates against the DRH schema** (using the `drh-target` Python package)
3. **Emits Singer messages** (SCHEMA, RECORD, STATE)
4. **Logs validation issues** (via OpenTelemetry)

#### High-Level Tap Architecture

```python
#!/usr/bin/env python3
"""
Custom DRH Singer Tap
"""
import sys
from drh_target.loader import DRHLoader
from your_data_reader import read_your_format

def main():
    # Initialize DRH loader (handles schema validation)
    loader = DRHLoader()
    
    # Read your data source
    for record in read_your_format("data.xlsx"):
        # Emit to DRH pipeline
        loader.emit_record("participant", record)
    
    # Emit final state
    loader.emit_state({"last_processed": "2024-02-06"})

if __name__ == "__main__":
    main()
```

The `DRHLoader` handles:

- Schema loading and validation
- Singer message formatting
- OpenTelemetry logging
- Error handling

### Validation Process

When you run your tap, data flows through a comprehensive **10-step validation pipeline** with OpenTelemetry tracking at every stage:

#### Validation Hierarchy

The DRH tap implements a structured validation workflow tracked as an OpenTelemetry trace:

![validation-hierachy](/drh-target/assets/validation-hierachy.png)

#### Validation Flow with Cascade Logic

![validation-flow](/drh-target/assets/validation-flow.png)

#### Detailed Validation Checks

| Check # | Category | OTel Span Name | What It Validates | Status Code |
|---------|----------|----------------|-------------------|-------------|
| 1 | Folder Scan | `1: Folder & Resource Scan` | Directory accessible, files readable | OK / ERROR |
| 2 | Mandatory Files | `2: Mandatory File Presence` | Required files present (participant.csv, study.csv, etc.) | OK / ERROR |
| 3 | File Extensions | `3: File Extension Validation` | All files are .csv format | OK / ERROR |
| 4 | Schema Validation | `4: File Schema Check` | Data conforms to DRH schemas | OK / ERROR |
| 4.1.a | Required Columns | `4.1.a: Required Columns` | All mandatory fields exist | OK / ERROR |
| 4.1.b | Type Checking | `4.1.b: Type Check` | Data types correct (string, integer, date) | OK / ERROR |
| 4.1.c | Format/Pattern | `4.1.c: Format & Pattern Check` | Dates, emails, IDs match patterns | OK / ERROR |
| 4.1.d | Foreign Keys | `4.1.d: Foreign Key Check` | *(Coming Soon)* Referential integrity | OK / ERROR |
| 4.1.e | Enum Values | `4.1.e: Enum Value Check` | *(Coming Soon)* Categorical constraints | OK / ERROR |
| 5 | CGM Metadata | `5: CGM Tracing Metadata Check` | CGM file metadata consistency | OK / ERROR |
| 6 | CGM Integrity | `6: CGM Data Integrity` | Glucose ranges, timestamps, completeness | OK / ERROR |
| 7 | Meal Metadata | `7: Meal Data Metadata Check` | Meal file metadata consistency | OK / ERROR |
| 8 | Meal Integrity | `8: Meal Data Integrity` | Meal timestamps, linkages, nutrition | OK / ERROR |
| 9 | Fitness Metadata | `9: Fitness Metadata Check` | Fitness file metadata consistency | OK / ERROR |
| 10 | Fitness Integrity | `10: Fitness Data Integrity` | Activity validity, temporal consistency | OK / ERROR |

#### OpenTelemetry Attributes and Metrics

Each validation check emits structured attributes and metrics:

**Span Attributes:**

- `validation.level`: Validation category (e.g., "schema_validation", "cgm_integrity")
- `file.name`: Name of the file being validated
- `file.row_count`: Number of rows processed
- `error_count`: Number of validation errors found
- `check.status`: PASS or FAIL

**Metrics Emitted:**

- `vv.validation.pass_count`: Number of checks passed
- `vv.validation.fail_count`: Number of checks failed
- `vv.files.processed_count`: Total files processed
- `vv.validation.duration`: Time taken for validation (seconds)

### Example: Preparing a Participant CSV

Your source file (`participants.csv`):

```csv
participant_id,study_id,age,gender,diagnosis_date
P001,S001,45,F,2024-01-15
P002,S001,52,M,2024-01-20
P003,S001,38,F,01/22/2024
```

**Validation Results:**

✅ Row 1 (P001): Valid - all fields present and correct  
✅ Row 2 (P002): Valid - all fields present and correct  
❌ Row 3 (P003): **ERROR** - `diagnosis_date` format invalid (expected: YYYY-MM-DD, got: MM/DD/YYYY)

**OTel Log Emitted:**

```json
{
  "severity": "ERROR",
  "body": "Invalid date format in field 'diagnosis_date'",
  "attributes": {
    "stream": "participant",
    "file": "participants.csv",
    "row": 3,
    "field": "diagnosis_date",
    "expected_format": "YYYY-MM-DD",
    "actual_value": "01/22/2024"
  }
}
```

You can then fix the date format and re-run the tap.

## Sample Tap Reference

A complete reference implementation is available in the **drh-edge** repository, providing a blueprint for end-to-end data ingestion.

- **Repository**: [spry-drh-edge-platform](https://github.com/diabetes-research/spry-drh-edge-platform)
- **Tap Location**: `drh-edge-core/singer-tap/tap-simplera_surveilr_singer_.py`

### **Core Capabilities**

This sample tap demonstrates the full integration of the protocol:

- **Multi-File Processing**: Reads multiple CSV files from a directory.
- **Comprehensive Validation**: Validates against all DRH schemas.
- **Full Observability**: Emits OpenTelemetry traces, logs, and metrics.
- **Advanced Logic**: Handles complex scenarios like CGM integrity and cross-file consistency.
- **Automated Environment**: Auto-installs dependencies via Python venv and the `drh-target` package.

---

#### **Using the Sample Tap**

To implement the tap, follow these steps to configure your environment and run the pipeline. Detailed documentation for the orchestration layer can be found in the [Spry DRH Edge Platform](https://github.com/diabetes-research/spry-drh-edge-platform) repository.

**1.Clone and Setup**

```bash
# Clone the repository
git clone https://github.com/diabetes-research/spry-drh-edge-platform.git
cd spry-drh-edge-platform/drh-edge-core

```

**2.Configure Your Environment**
Modify the existing Markdown files to match your data requirements:

- **Markdown Update**: Copy any existing Markdown and modify the data output paths in the bash blocks.
- **UI/SQL Configuration**: Modify the SQL required for data display in the SQLPage integration.
- **Environment Variables**: Locate the `envrc` block within the Markdown file to define your environment context.

**3. Execution**
Use the **SPRY** tool to prepare your environment and execute the tap:

```bash
# Set environment variables
export TENANT_ID="MY_LAB"
export TENANT_NAME="My Research Lab"
export STUDY_DATA_PATH="path/to/your/csvs"

# Prepare the environment using Spry tasks
spry rb task prepare-env drh-simplera-spry.md
direnv allow

# Run the tap (outputs Singer messages to stdout)
python3 singer-tap/tap-simplera.surveilr\[singer]\.py

# Or pipe directly to a target file for verification
python3 singer-tap/tap-simplera.surveilr\[singer]\.py > result_simplera.txt

```

When preparing data for DRH ingestion:

✅ **Use consistent date formats** (ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)  
✅ **Standardize categorical values** (e.g., gender: Male, Female, Other, Unknown)  
✅ **Use unique, stable IDs** (participant_id should never change)  
✅ **Maintain referential integrity** (every participant.study_id must exist in study.study_id)  
✅ **Document data provenance** (include metadata files describing data sources)  
✅ **Test with small datasets first** (validate schema compliance before full ingestion)  
✅ **Review validation logs** (check OTel logs for warnings and errors)

---

## Python Implementation Guide

The DRH Protocol provides a Python package (`drh-target`) that simplifies creating Singer taps for medical research data.

### Installation

#### Install from GitHub

```bash
pip install git+https://github.com/diabetes-research/singer-drh-protocol.git#subdirectory=drh-target/python-pkg
```

#### Verify Installation

```python
python3 -c "import drh_target; print('DRH Target installed successfully')"
```

### Using DRHLoader

The core class for emitting Singer messages is `DRHLoader`:

```python
from drh_target.loader import DRHLoader

# Initialize the loader
loader = DRHLoader()
```

### Emitting SCHEMA Messages

Schema messages are automatically emitted when you first emit a record for a stream. The schema is loaded from the DRH protocol definitions.

```python
# Schema is emitted automatically on first use
loader.emit_record("participant", {"participant_id": "P001", ...})
```

Alternatively, you can explicitly emit a schema:

```python
# Load and emit schema for a specific stream
schema = loader.load_schema("participant")
loader.emit_schema("participant", schema, key_properties=["participant_id"])
```

### Emitting RECORD Messages

Records are the core data payloads. Each record must conform to its stream's schema.

```python
# Emit a participant record
participant = {
    "participant_id": "P001",
    "study_id": "S001",
    "age": 45,
    "gender": "F",
    "diagnosis_date": "2024-01-15",
    "site_id": "SITE-01"
}

loader.emit_record("participant", participant)
```

The `emit_record` method:

1. Validates the record against the schema
2. Checks required fields
3. Verifies data types
4. Validates format patterns
5. Emits OpenTelemetry logs for errors
6. Outputs a Singer RECORD message to stdout

### Emitting STATE Messages

State messages track processing progress for resumable extraction:

```python
# Emit state after processing a batch
state = {
    "last_processed_file": "participants_2024-01-15.csv",
    "last_timestamp": "2024-01-15T23:59:59Z",
    "records_processed": 150
}

loader.emit_state(state)
```

### Complete Example: CSV to Singer Tap

Here's a complete example that reads a CSV and emits validated Singer messages:

```python
#!/usr/bin/env python3
"""
Example DRH Singer Tap: Participant CSV Reader
"""
import sys
import csv
from datetime import datetime, timezone
from drh_target.loader import DRHLoader

def main():
    # Initialize DRH loader
    loader = DRHLoader()
    
    # Track processing statistics
    records_processed = 0
    records_valid = 0
    records_invalid = 0
    
    # Read participant CSV
    with open("participants.csv", "r") as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            records_processed += 1
            
            # Prepare record (convert types as needed)
            record = {
                "participant_id": row["participant_id"],
                "study_id": row["study_id"],
                "age": int(row["age"]),
                "gender": row["gender"],
                "diagnosis_date": row["diagnosis_date"],
                "site_id": row.get("site_id"),  # Optional field
                "tenant_id": "MY_LAB",
                "tenant_name": "My Research Lab"
            }
            
            # Emit record (validation happens here)
            try:
                loader.emit_record("participant", record)
                records_valid += 1
            except Exception as e:
                records_invalid += 1
                # Error is already logged via OpenTelemetry
                print(f"ERROR: Row {records_processed} failed validation: {e}", 
                      file=sys.stderr)
    
    # Emit final state
    state = {
        "last_processed": datetime.now(timezone.utc).isoformat(),
        "records_processed": records_processed,
        "records_valid": records_valid,
        "records_invalid": records_invalid
    }
    loader.emit_state(state)
    
    # Log summary to stderr
    print(f"Processed {records_processed} records: "
          f"{records_valid} valid, {records_invalid} invalid", 
          file=sys.stderr)

if __name__ == "__main__":
    main()
```

#### Running the Tap

```bash
# Output to stdout (see Singer messages)
python3 tap_participant.py

# Save to file
python3 tap_participant.py > output.jsonl
```

### Advanced: Custom Validation

You can extend `DRHLoader` to add custom validation logic:

```python
from drh_target.loader import DRHLoader

class CustomDRHLoader(DRHLoader):
    def emit_record(self, stream_name, record):
        # Custom validation before standard checks
        if stream_name == "participant":
            # Ensure age is realistic
            if not (0 <= record.get("age", 0) <= 120):
                raise ValueError(f"Invalid age: {record.get('age')}")
            
            # Check diagnosis date is not in future
            diagnosis_date = record.get("diagnosis_date")
            if diagnosis_date and diagnosis_date > datetime.now().date():
                raise ValueError(f"Diagnosis date in future: {diagnosis_date}")
        
        # Call parent method for standard validation
        super().emit_record(stream_name, record)
```

### OpenTelemetry Integration

The `DRHLoader` automatically emits OpenTelemetry data. To access OTel features:

```python
from drh_target.loader import DRHLoader

# Initialize loader with OTel resource ID
loader = DRHLoader()
loader.otel_resource_id = "my-tap-instance"

# Emit a record (OTel logs are automatic on errors)
try:
    loader.emit_record("participant", record)
except Exception as e:
    # Additional custom OTel log
    loader.emit_otel_log(
        severity="ERROR",
        message=f"Custom validation failed: {e}",
        attributes={"custom_field": "value"}
    )
```

### Error Handling Strategies

Different approaches for handling validation errors:

#### 1. **Fail Fast** (Stop on first error)

```python
for row in csv_reader:
    loader.emit_record("participant", row)  # Raises exception on error
```

#### 2. **Continue on Error** (Process all, log errors)

```python
for row in csv_reader:
    try:
        loader.emit_record("participant", row)
    except Exception as e:
        # Log error but continue processing
        print(f"Row {row_num} failed: {e}", file=sys.stderr)
        continue
```

#### 3. **Collect Errors** (Report summary at end)

```python
errors = []
for row_num, row in enumerate(csv_reader, 1):
    try:
        loader.emit_record("participant", row)
    except Exception as e:
        errors.append({"row": row_num, "error": str(e)})

# Emit error summary in state
loader.emit_state({
    "errors": errors,
    "error_count": len(errors)
})
```

## Support and Contact

- **Documentation**: [DRH Platform Docs](https://drh.diabetestechnology.org/)
- **Implementation Example**: [spry-drh-edge-platform](https://github.com/diabetes-research/spry-drh-edge-platform)

---

## Related Projects

- **DRH Edge Platform**: Complete ETL pipeline with Spry orchestration  
  [github.com/diabetes-research/spry-drh-edge-platform](https://github.com/diabetes-research/spry-drh-edge-platform)
- **Singer Specification**: Official Singer protocol documentation  
  [github.com/singer-io/getting-started](https://github.com/singer-io/getting-started)
- **OpenTelemetry**: Observability framework  
  [opentelemetry.io](https://opentelemetry.io/)

---

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](/LICENSE) file for details.
