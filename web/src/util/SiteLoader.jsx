import React from "react";
import Loader from "react-loader-spinner";

import "./SiteLoader.scss";

export default ({ size = "lg" }) => (
  <div className="text-primary">
    <Loader
      width={size == "lg" ? 80 : 20}
      height={size == "lg" ? 80 : 20}
      type="Grid"
      fill={null}
      className={`site-loader ${size}`}
    />
  </div>
);
