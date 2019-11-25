import React from "react";
import Badge from "react-bootstrap/Badge";
import "./BadgedText.scss";

export function BadgedText({ badge, variant = "primary", children, ...props }) {
  return (
    <span {...props} className="list-item-badge">
      <Badge variant={variant} className="mr-2">
        {badge}
      </Badge>
      {children}
    </span>
  );
}
