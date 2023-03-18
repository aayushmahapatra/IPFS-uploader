/* eslint-disable no-console */
import React, { useState, useEffect } from "react";
import { create } from "ipfs-http-client";

const Connect = ({ setIpfs }) => {
  const [multiaddr, setMultiaddr] = useState(
    "http://provider.palmito.duckdns.org:32534/api/v0"
  );
  const [error, setError] = useState(null);

  const connect = async (e) => {
    try {
      const http = create({
        url: multiaddr,
      });

      const isOnline = await http.isOnline();

      if (isOnline) {
        setIpfs(http);
        setError(null);
      }

      setIpfs(http);
      setError(null);
    } catch (err) {
      setError("erere", err.message);
    }
  };

  return (
    <main className="flex justify-center mt-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col w-2/3"
      >
        <label htmlFor="connect-input" className="opacity-70">
          IPFS Node URL (Internal Port: 5001) with /api/v0 prefix
        </label>
        <input
          className="border text-black rounded p-2 focus:outline-none"
          id="connect-input"
          name="connect-input"
          type="text"
          required
          value={multiaddr}
          onChange={(e) => setMultiaddr(e.target.value)}
        />

        <button
          className="bg-black mt-4 p-2 rounded active:bg-black/40"
          id="connect-submit"
          type="submit"
          onClick={connect}
        >
          Connect
        </button>
      </form>

      {error && <div className="">Error: {error.message || error}</div>}
    </main>
  );
};

const SaveFile = ({ ipfs }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [fileHash, setFileHash] = useState(null);
  const [error, setError] = useState(null);

  const captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();

    isChecked
      ? saveToIpfsWithFilename(event.target.files)
      : saveToIpfs(event.target.files);
  };

  // Example #1
  // Add file to IPFS and return a CID
  const saveToIpfs = async ([file]) => {
    try {
      const added = await ipfs.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });

      setFileHash(added.cid.toString());
    } catch (err) {
      setError(err.message);
    }
  };

  // Example #2
  // Add file to IPFS and wrap it in a directory to keep the original filename
  const saveToIpfsWithFilename = async ([file]) => {
    const fileDetails = {
      path: file.name,
      content: file,
    };

    const options = {
      wrapWithDirectory: true,
      progress: (prog) => console.log(`received: ${prog}`),
    };

    try {
      const added = await ipfs.add(fileDetails, options);

      setFileHash(added.cid.toString());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="flex justify-center mt-16">
      <section>
        <form id="capture-media" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="input-file" className="opacity-80 mb-2">
              File to upload
            </label>
            <input
              className="bg-white text-black p-2 rounded"
              id="input-file"
              name="input-file"
              type="file"
              onChange={captureFile}
            />
          </div>

          <div className="flex items-center my-2">
            <input
              className="mr-2"
              type="checkbox"
              id="keep-filename"
              name="keep-filename"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            <label htmlFor="keep-filename" className="text-sm">
              keep filename
            </label>
          </div>
        </form>

        {fileHash && (
          <div>
            <a
              id="gateway-link"
              target="_blank"
              rel="noreferrer"
              href={"https://ipfs.io/ipfs/" + fileHash}
              className="underline"
            >
              CID: {fileHash}
            </a>
          </div>
        )}

        {error && (
          <div className="bg-red pa3 center mv3 white">
            Error: {error.message || error}
          </div>
        )}
      </section>
    </main>
  );
};

const Details = ({ keys, obj }) => {
  if (!obj || !keys || keys.length === 0) return null;
  return (
    <section className="w-2/3 mx-auto">
      {keys?.map((key) => (
        <div className="mb-4" key={key}>
          <h2 className="opacity-70">{key}</h2>
          <div
            className="bg-white border text-black rounded px-2 py-1"
            data-test={key}
          >
            {obj[key].toString()}
          </div>
        </div>
      ))}
    </section>
  );
};

const App = () => {
  const [ipfs, setIpfs] = useState(null);
  const [version, setVersion] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    if (!ipfs) return;

    const getVersion = async () => {
      const nodeId = await ipfs.version();
      setVersion(nodeId);
    };

    const getId = async () => {
      const nodeId = await ipfs.id();
      setId(nodeId);
    };

    getVersion();
    getId();
  }, [ipfs]);

  return (
    <main className="bg-teal-900 h-[100vh] text-white">
      <header className="p-4 text-xl">
        <a
          href="https://ipfs.io"
          title="home"
          className="border border-white px-4 py-2 rounded"
        >
          IPFS
        </a>
      </header>

      <section className="w-full">
        <h1 className="text-center text-3xl">HTTP client upload file</h1>

        <Connect setIpfs={setIpfs}></Connect>
        <br />
        {ipfs && (
          <>
            {(id || version) && (
              <>
                <h1
                  className="text-center text-3xl w-1/3 mx-auto my-8 bg-white/80 text-green-600 rounded p-1 shadow"
                  data-test="title"
                >
                  Connected to IPFS
                </h1>
                <div>
                  {id && <Details obj={id} keys={["id", "agentVersion"]} />}
                  {version && <Details obj={version} keys={["version"]} />}
                </div>
              </>
            )}

            <SaveFile ipfs={ipfs}></SaveFile>
          </>
        )}
      </section>
    </main>
  );
};

export default App;
