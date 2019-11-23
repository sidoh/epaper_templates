import React, { useCallback, useMemo } from "react";
import Form from "react-jsonschema-form";
import { drillExtract, deepClearFields, deepClearNonMatching, deepPatch } from "../util/mungers";
import createSchema from "./schema";

export function SvgFieldEditor({
  value,
  onUpdate,
  screenMetadata,
  activeElements
}) {
  const onFormChange = useCallback(
    data => {
      onUpdate(obj => deepPatch(obj, data.formData))
    },
    [onUpdate]
  );

  const schema = useMemo(
    () => createSchema({ screenMetadata, selectedFields: activeElements }),
    [screenMetadata, activeElements]
  );

  const formValues = useMemo(() => {
    const selectedValues = activeElements.map(x => drillExtract(value, x));
    const fieldData = deepClearNonMatching(selectedValues);

    return fieldData || {};
  }, [schema, value]);

  console.log(formValues);

  return (
    <Form
      schema={schema}
      formData={formValues}
      onChange={onFormChange}
      idPrefix="root"
      tagName="div"
    >
      <div className="d-none">
        <input type="submit" />
      </div>
    </Form>
  );
}
