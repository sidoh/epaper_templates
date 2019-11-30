import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useState } from "react";
import ReactSlider from "react-slider";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";

export function LocationEditor({ onUpdateActive }) {
  const [nudgeDistance, setNudgeDistance] = useState(1);
  const onUpdateLocation = useCallback(
    (dimension, amount) => {
      const fn = obj => {
        [`${dimension}`, `${dimension}1`, `${dimension}2`].forEach(d => {
          if (obj[d] != null) {
            obj[d] += amount;
          }
        });
      };

      onUpdateActive(fn);
    },
    [onUpdateActive]
  );

  const onLeft = useCallback(() => onUpdateLocation("x", -nudgeDistance), [
    onUpdateLocation,
    nudgeDistance
  ]);
  const onRight = useCallback(() => onUpdateLocation("x", nudgeDistance), [
    onUpdateLocation,
    nudgeDistance
  ]);
  const onUp = useCallback(() => onUpdateLocation("y", -nudgeDistance), [
    onUpdateLocation,
    nudgeDistance
  ]);
  const onDown = useCallback(() => onUpdateLocation("y", nudgeDistance), [
    onUpdateLocation,
    nudgeDistance
  ]);

  return (
    <>
      <h5>Nudge</h5>
      <div className="d-flex">
        <ReactSlider
          value={nudgeDistance}
          min={1}
          max={20}
          onChange={setNudgeDistance}
        />
        <small className="text-muted ml-2 mb-1" style={{ lineHeight: 1 }}>
          {nudgeDistance}px
        </small>
      </div>
      <table className="mx-auto mt-2">
        <tbody>
          <tr>
            <td></td>
            <td>
              <Button onClick={onUp}>
                <MemoizedFontAwesomeIcon icon={faChevronUp} />
              </Button>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <Button onClick={onLeft}>
                <MemoizedFontAwesomeIcon icon={faChevronLeft} />
              </Button>
            </td>
            <td></td>
            <td>
              <Button onClick={onRight}>
                <MemoizedFontAwesomeIcon icon={faChevronRight} />
              </Button>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <Button onClick={onDown}>
                <MemoizedFontAwesomeIcon icon={faChevronDown} />
              </Button>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
