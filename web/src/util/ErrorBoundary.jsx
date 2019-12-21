import React from "react";
import Alert from "react-bootstrap/Alert";
import Jumbotron from "react-bootstrap/Jumbotron";
import MemoizedFontAwesomeIcon from "./MemoizedFontAwesomeIcon";
import {
  faClipboard,
  faExclamationCircle,
  faCopy,
  faExternalLinkAlt,
  faRecycle
} from "@fortawesome/free-solid-svg-icons";
import Button from "react-bootstrap/Button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error, info) {
    console.log(error, info);
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { error: error };
  }

  onRefresh() {
    window.location.reload();
  }

  render() {
    if (this.state.error) {
      console.log(this.state.error);
      const error_object = this.state.error;
      const errorDefn = {
        error: {
          fileName: error_object.fileName,
          lineNumber: error_object.lineNumber,
          message: error_object.message,
          stack: error_object.stack,
          columnNumber: error_object.columnNumber,
          name: error_object.name
        }
      };

      return (
        <Jumbotron className="py-4">
          <h3 className="text-danger">
            <MemoizedFontAwesomeIcon
              icon={faExclamationCircle}
              className="fa-f2 mr-2"
            />
            Encountered error. This is a bug!
          </h3>

          <div className="my-5">
            <h5>
              Click the button below to create an auto-filled Github issue.
              Please also include:
            </h5>

            <ul>
              <li>What you did right before the error happened</li>
              <li>The template or data you were working with</li>
              <li>If possible, a reliable way to reproduce the issue</li>
            </ul>

            <div className="d-flex">
              <a
                href={`https://github.com/sidoh/epaper_templates/issues/new?title=[Unexpected Webpage Error] ${
                  error_object.message
                }&body=\`\`\`json%0A${JSON.stringify(errorDefn)}%0A\`\`\``}
                target="_blank"
                className="btn btn-info mr-2"
                variant="info"
              >
                <MemoizedFontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="fa-fw mr-2"
                />
                Create Github Issue
              </a>

              <Button variant="outline-warning" onClick={this.onRefresh}>
                <MemoizedFontAwesomeIcon icon={faRecycle} className="fa-fw mr-2" />
                Reload Page
              </Button>
            </div>
          </div>

          <div>
            <textarea
              className="w-100"
              rows="3"
              style={{ fontFamily: "monospace" }}
              readOnly
            >
              {JSON.stringify(errorDefn, null, 2)}
            </textarea>
          </div>
        </Jumbotron>
      );
    } else {
      return <>{this.props.children}</>;
    }
  }
}
