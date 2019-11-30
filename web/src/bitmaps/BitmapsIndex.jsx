import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from "react";
import {
  Link,
  Route,
  Switch,
  useHistory,
  useRouteMatch
} from "react-router-dom";
import { useLocation, useMap, useLocalStorage } from "react-use";
import api from "../util/api";
import SiteLoader from "../util/SiteLoader";
import BitmapCanvas from "./BitmapCanvas";
import BitmapEditor from "./BitmapEditor";
import "./BitmapIndex.scss";
import NewBitmapConfigurator from "./NewBitmapConfigurator";
import simpleHash from "../util/hash";
import { fromByteArray, toByteArray } from "base64-js";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";

const BitmapPreview = ({ definition, data }) => {
  const { metadata: { width = 64, height = 64 } = {} } = definition;

  return (
    <li>
      <Link className="bitmap-link" to={`/bitmaps/${definition.filename}`}>
        <div className="h-100 d-flex flex-column">
          {data == null && <SiteLoader size="sm" />}
          {data != null && (
            <BitmapCanvas
              className="thumbnail-preview"
              data={data}
              scaleFactor={10}
              width={width}
              height={height}
            />
          )}
          <div className="mt-auto filename">{definition.filename}</div>
        </div>
      </Link>
    </li>
  );
};

const BitmapList = ({ bitmapData, bitmapList }) => {
  const _sortedList = useMemo(() => {
    return (
      bitmapList &&
      bitmapList.sort((a, b) => a.filename.localeCompare(b.filename))
    );
  }, [bitmapList]);

  return (
    <>
      {bitmapList == null && <SiteLoader />}
      {bitmapList != null && (
        <>
          <Link className="new-bitmap" to={`/bitmaps/_new`}>
            <div className="d-flex justify-content-center">
              <MemoizedFontAwesomeIcon icon={faPlus} className="fa-fw mr-1" />
            </div>
            New Bitmap
          </Link>
          <ul className="bitmap-list">
            {_sortedList.map(x => (
              <BitmapPreview
                key={x.name}
                definition={x}
                data={bitmapData[x.name]}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
};

const ShowBitmapEditor = ({ reload, doneLoading, bitmapData, bitmapList }) => {
  const match = useRouteMatch();
  const history = useHistory();
  const location = useLocation();
  const filename = match.params.filename;
  const isNew = filename === "_new";

  const [bitmapDefinition, setBitmapDefinition] = useState(null);
  const [_bitmapData, _setBitmapData] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bt = bitmapList && bitmapList.find(x => x.filename == filename);
    setBitmapDefinition(bt);

    if (bt) {
      _setBitmapData(bitmapData[bt.name]);
    }

    setInitializing(false);
  }, [bitmapList, filename, bitmapData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const filename = params.get("filename");
    if (filename) {
      const width = parseInt(params.get("w"));
      const height = parseInt(params.get("h"));

      const bitmap = {
        filename,
        metadata: { width, height },
        name: `/b/${filename}`
      };
      _setBitmapData(new Uint8Array((width * height) / 8));
      setBitmapDefinition(bitmap);
    }
  }, [location]);

  const onSave = useCallback(
    (data, metadata) => {
      const formData = new FormData();
      const _metadata = { ...metadata, hash: simpleHash(data) };

      // Add actual file
      const file = new Blob([data], { type: "application/octet-stream" });
      formData.append("bitmap", file, bitmapDefinition.filename);

      // Add metadata (including height, width, etc)
      formData.append(
        "metadata",
        new Blob([JSON.stringify(_metadata)], { type: "application/json" }),
        "metadata.json"
      );

      api.post("/bitmaps", formData).then(() => {
        reload([bitmapDefinition.name], () => {
          if (isNew) {
            history.push(`/bitmaps/${bitmapDefinition.filename}`);
          }
        });
      });
    },
    [history, bitmapDefinition, reload]
  );

  const onDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this bitmap?")) {
      api.delete(`/bitmaps/${bitmapDefinition.filename}`).then(() => {
        reload();

        history.push("/bitmaps");
      });
    }
  }, [history, bitmapDefinition, reload]);

  const onNewBitmap = useCallback(({ filename, width, height }) => {
    history.push(`${match.url}?filename=${filename}&w=${width}&h=${height}`);
  }, []);

  if (bitmapDefinition == null) {
    if (!doneLoading || initializing) {
      return <SiteLoader />;
    } else if (isNew) {
      return <NewBitmapConfigurator onSave={onNewBitmap} />;
    } else {
      return <h3 className="text-center pt-5">Bitmap not found</h3>;
    }
  } else {
    return (
      <BitmapEditor
        onDelete={onDelete}
        onSave={onSave}
        bitmapDefinition={bitmapDefinition}
        initialData={_bitmapData}
      />
    );
  }
};

export default props => {
  const [bitmapList, setBitmapList] = useState(null);
  const [bitmaps, { set: setBitmap }] = useMap({});
  const [bitmapCache, setBitmapCache] = useLocalStorage("bitmap_cache", {});
  const doneLoading = useRef(false);

  const reloadList = useCallback(() => {
    return new Promise((resolve, reject) => {
      api.get("/bitmaps").then(
        e => {
          doneLoading.current = true;

          const list = e.data.map(x => {
            const filename = x.name.split("/").slice(-1)[0];
            return { ...x, filename };
          });

          setBitmapList(list);
          resolve(list);
        },
        e => {
          reject(e);
        }
      );
    });
  }, []);

  const reloadBitmaps = useCallback(
    (bitmapList, forceReload = []) => {
      // const { metadata: { hash = null } = {} } = x;

      // if (bitmapCache[x.name] && bitmapCache[x.name].hash == hash) {
      //   return false;
      // }
      const isCached = x => {
        const { name, metadata: { hash = null } = {} } = x;
        return bitmapCache[name] && bitmapCache[name].hash == hash;
      };

      const updatedCache = {};
      const updatePromises = bitmapList
        .filter(
          x =>
            !isCached(x) &&
            (!bitmaps[x.name] || forceReload.find(r => r == x.name))
        )
        .map(x => {
          return api
            .get(`/bitmaps/${x.filename}`, {
              responseType: "arraybuffer"
            })
            .then(e => {
              const cacheData = new Uint8Array(e.data);

              updatedCache[x.name] = {
                hash: simpleHash(cacheData),
                data: fromByteArray(cacheData)
              };

              setBitmap(x.name, e.data);
            });
        });

      bitmapList
        .filter(x => isCached(x))
        .map(x => {
          setBitmap(x.name, toByteArray(bitmapCache[x.name].data));
        });

      Promise.all(updatePromises).then(() => {
        setBitmapCache({ ...bitmapCache, ...updatedCache });
      });
    },
    [bitmaps, bitmapCache]
  );

  const reload = useCallback(
    (forceReload = [], onComplete = () => {}) => {
      reloadList()
        .then(e => reloadBitmaps(e, forceReload))
        .then(onComplete);
    },
    [reloadBitmaps]
  );

  useEffect(reload, []);

  return (
    <Switch>
      <Route path="/bitmaps/:filename">
        <ShowBitmapEditor
          doneLoading={doneLoading.current}
          bitmapData={bitmaps}
          bitmapList={bitmapList}
          reload={reload}
        />
      </Route>
      <Route exact path="/bitmaps">
        <BitmapList bitmapData={bitmaps} bitmapList={bitmapList} />
      </Route>
    </Switch>
  );
};
