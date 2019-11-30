import React, { useCallback, useMemo } from "react";
import Form from "react-jsonschema-form";
import {
  drillExtract,
  deepClearFields,
  deepClearNonMatching,
  deepPatch
} from "../util/mungers";
import createSchema from "./schema";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";

export function SvgFieldEditor({
  value,
  onUpdateActive,
  screenMetadata,
  activeElements,
  allBitmaps
}) {
  const onFormChange = useCallback(
    data => {
      onUpdateActive(obj => deepPatch(obj, data.formData));
    },
    [activeElements, onUpdateActive]
  );

  const schema = useMemo(
    () => {
      let formatters = [];

      if (value && Array.isArray(value.formatters)) {
        formatters = value.formatters.map(x => {
          return x && typeof x === "object" && x.name
        }).filter(x => x)
      }

      return createSchema({
        screenMetadata,
        selectedFields: activeElements,
        allBitmaps: Object.keys(allBitmaps),
        allFormatters: formatters
      })
    },
    [value.formatters, screenMetadata, activeElements, allBitmaps]
  );

  const hasFields = Object.keys(schema.properties || {}).length > 0;

  const formValues = useMemo(() => {
    const selectedValues = activeElements.map(x => drillExtract(value, x));
    const fieldData = deepClearNonMatching(selectedValues);

    return fieldData || {};
  }, [schema, value]);

  return (
    <>
      {activeElements.length == 0 && <i>Nothing selected.</i>}
      {activeElements.length > 0 && !hasFields && (
        <i>Selected elements have no fields in common.</i>
      )}
      {activeElements.length > 0 && hasFields && (
        <Form
          schema={schema}
          ArrayFieldTemplate={ArrayFieldTemplate}
          formData={formValues}
          onChange={onFormChange}
          idPrefix="root"
          tagName="div"
        >
          <div className="d-none">
            <input type="submit" />
          </div>
        </Form>
      )}
    </>
  );
}
