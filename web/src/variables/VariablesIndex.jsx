import {
  faCheck,
  faPlus,
  faSave,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import api from "../util/api";
import SiteLoader from "../util/SiteLoader";
import { useTimeoutFn } from "react-use";
import "./VariablesIndex.scss";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import useGlobalState from "../state/global_state";

const UpdatedRecentlyBadge = ({ lastUpdated }) => {
  const [isHidden, setHidden] = useState(false);
  const badgeElmt = useRef(null);
  const hideFn = useCallback(() => {
    setHidden(true);
  }, []);
  const [isReady, cancel, reset] = useTimeoutFn(hideFn, 2000);

  useEffect(() => {
    reset();
    setHidden(false);
  }, [lastUpdated]);

  return (
    <div
      className={`text-success save-success${isHidden ? " hidden" : ""}`}
      ref={badgeElmt}
    >
      <MemoizedFontAwesomeIcon icon={faCheck} />
    </div>
  );
};

const VariableEditor = ({
  errors = {},
  lastSavedAt = null,
  variableKey,
  variableValue,
  onChange,
  isNew,
  id,
  onSubmit,
  onDelete,
  lastUpdated
}) => {
  const _onSubmit = useCallback(() => {
    onSubmit(id, { variableKey: variableKey, variableValue: variableValue });
  }, [variableKey, variableValue]);

  const _onChangeKey = useCallback(
    e => {
      const value = e.target.value;
      onChange(id, { variableKey: value });
    },
    [onChange]
  );

  const _onChangeValue = useCallback(
    e => {
      const value = e.target.value;
      onChange(id, { variableValue: value });
    },
    [onChange, _onSubmit]
  );

  const _onBlur = useCallback(
    e => {
      if (!isNew) {
        _onSubmit();
      }
    },
    [isNew, _onSubmit]
  );

  const _onKeyPress = useCallback(
    e => {
      if (e.key == "Enter") {
        _onBlur();
      }
    },
    [_onBlur]
  );

  return (
    <div className="d-flex variable-row">
      <div className="variable-key flex-grow-1">
        {isNew && (
          <>
            {errors.variableKey && (
              <div className="error text-danger">{errors.variableKey}</div>
            )}
            <Form.Control
              className={errors.variableKey ? "error" : ""}
              value={variableKey}
              onChange={_onChangeKey}
              disabled={!isNew}
            />
          </>
        )}
        {!isNew && <Form.Label>{variableKey}</Form.Label>}
      </div>

      <Form.Control
        className="flex-grow-1"
        value={variableValue}
        onChange={_onChangeValue}
        onBlur={_onBlur}
        onKeyPress={_onKeyPress}
      />

      <div className="flex-grow-1 button-container">
        {isNew && (
          <Button variant="success" onClick={_onSubmit}>
            <MemoizedFontAwesomeIcon icon={faSave} className="fa-fw mr-1" />
          </Button>
        )}
        {!isNew && (
          <>
            <Button variant="danger" onClick={onDelete}>
              <MemoizedFontAwesomeIcon icon={faTrash} className="fa-fw mr-1" />
            </Button>
            {lastUpdated && <UpdatedRecentlyBadge lastUpdated={lastUpdated} />}
          </>
        )}
      </div>
    </div>
  );
};

const VariablesEditor = ({
  onChange,
  onAdd,
  onDelete,
  onSubmit,
  variables
}) => {
  return (
    <div className="variables-form">
      {variables.map(x => (
        <VariableEditor
          key={x.id}
          {...x}
          onSubmit={onSubmit}
          onChange={onChange}
          onDelete={e => onDelete(x.id)}
        />
      ))}
      <Button variant="success" onClick={onAdd}>
        <MemoizedFontAwesomeIcon icon={faPlus} className="fa-fw mr-1" />
        Add Variable
      </Button>
    </div>
  );
};

export default props => {
  const [variables, setVariables] = useState(null);
  const [globalState, globalActions] = useGlobalState();
  const onChangeRef = useRef(null);

  useEffect(() => {
    const fields = {};

    Object.entries(globalState.variables).forEach(([variableKey, variableValue], id) => {
      fields[id] = {
        variableKey,
        variableValue,
        isNew: false,
        id
      };
    });

    setVariables(fields);
  }, [globalState.variables]);


  const onChange = useCallback(
    (id, fields) => {
      setVariables({
        ...variables,
        [id]: { ...variables[id], ...fields }
      });
    },
    [variables]
  );

  const onAdd = useCallback(() => {
    const id = Object.keys(variables).length;
    setVariables({
      ...variables,
      [id]: { variableKey: "", variableValue: "", isNew: true, id }
    });
  }, [variables]);

  const onDelete = useCallback(
    id => {
      const variable = variables[id];
      const copy = { ...variables };
      delete copy[id];
      setVariables(copy);

      api.delete(`/variables/${variable.variableKey}`);
    },
    [variables]
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const onSubmit = useCallback(
    (id, fields) => {
      const errors = {};

      if (!fields.variableKey || fields.variableKey.length < 0) {
        errors.variableKey = "Required";
      }
      if (!fields.variableKey.match(/^[a-zA-Z0-9_-]+$/)) {
        errors.variableKey = "Must be alphanumeric (with _ or -)";
      }
      if (
        Object.values(variables).filter(
          x => x.variableKey == fields.variableKey
        ).length > 1
      ) {
        errors.variableKey = "This variable already exists";
      }

      const hasErrors = Object.keys(errors).length > 0;

      if (!hasErrors) {
        api
          .put("/variables", { [fields.variableKey]: fields.variableValue })
          .then(e => {
            onChangeRef.current(id, {
              ...fields,
              errors,
              isNew: hasErrors,
              lastUpdated: new Date()
            });
          });
      }

      onChangeRef.current(id, { ...fields, errors, isNew: hasErrors });
    },
    [onChange, variables]
  );

  return (
    <>
      {variables == null && <SiteLoader />}
      {variables != null && (
        <VariablesEditor
          onChange={onChange}
          onAdd={onAdd}
          onDelete={onDelete}
          onSubmit={onSubmit}
          variables={Object.values(variables)}
        />
      )}
    </>
  );
};
