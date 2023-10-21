import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { PreviewPane } from "./PreviewPane";
import type { Role } from "./Role";
import { RoleConfigurator } from "./RoleConfigurator";
import { ColorBlindModes } from "./ColorBlindModes";
import { ColorBlindMode, colorBlindModes as allColorBlindModes } from "./colorBlind";
import Twemoji from "react-twemoji";
import { Switch } from "./Switch";
import { htmlToImage } from "./htmlToImage";
import { downloadImage } from "./downloadImage";
import { copyLink } from "./copyLink";
import { loadState, saveState } from "./saveableState";
import { useEffectIgnoreFirstCall } from "./utils";

const defaultRoles: Role[] = [
    {
        id: 0,
        name: "VANGUARD and Modmail",
        color: "#ea3355",
        native: true,
    },
    {
        id: 0,
        name: "Administrator",
        color: "#ff3041",
        native: true,
    },
    {
        id: 0,
        name: "Moderator",
        color: "#ff4655",
        native: true,
    },
    {
        id: 0,
        name: "Events Team",
        color: "#d954ef",
        native: true,
    },
    {
        id: 0,
        name: "Design Team",
        color: "#5282ff",
        native: true,
    },
    {
        id: 0,
        name: "Riot Employee",
        color: "#ff2c2c",
        native: true,
    },
    {
        id: 0,
        name: "Your custom role",
        color: "#1c9e22",
        native: false,
    },
];

defaultRoles.forEach((role, index) => (role["id"] = index + 1));

export function App() {
    const [roles, setRoles] = useState<Role[]>(JSON.parse(JSON.stringify(defaultRoles)));
    const [colorBlindModes, setColorBlindModes] = useState<Set<ColorBlindMode>>(new Set());

    const [simulateColorBlindness, setSimulateColorBlindness] = useState(false);

    useEffect(() => {
        if (colorBlindModes.size > 0 && !simulateColorBlindness) {
            setSimulateColorBlindness(true);
        }
    }, [colorBlindModes]);

    function getColorBlindRoles(mode: ColorBlindMode, roles: Role[]): Role[] {
        return roles.map((role) => {
            return {
                ...role,
                color: mode.convert(role.color),
            };
        });
    }

    function loadAndApplyState(allowEmptyReset = false) {
        const savedState = loadState();
        if (!savedState) {
            if (allowEmptyReset) {
                reset();
            }

            return;
        }

        setRoles(savedState.roles);

        const matchingColorBlindModes = allColorBlindModes.filter((mode) =>
            savedState.colorBlindModes.includes(mode.name),
        );
        setColorBlindModes(new Set(matchingColorBlindModes));
    }

    useEffect(() => {
        loadAndApplyState();

        const ref = () => loadAndApplyState(true);
        window.addEventListener("hashchange", ref);
        return () => window.removeEventListener("hashchange", ref);
    }, []);

    function getSaveableState() {
        return {
            roles,
            colorBlindModes: Array.from(colorBlindModes).map((mode) => mode.name),
        };
    }

    // Skip the initial call
    useEffectIgnoreFirstCall(() => {
        saveState(getSaveableState());
    }, [roles, colorBlindModes]);

    function reset() {
        window.location.hash = "#";
        window.location.reload();
    }

    const previewRef = useRef<HTMLDivElement | null>(null);
    const [creatingImage, setCreatingImage] = useState(false);

    async function generateAndDownloadImage() {
        if (!previewRef.current || creatingImage) {
            return;
        }

        setCreatingImage(true);

        const dataUrl = await htmlToImage(previewRef.current);
        await downloadImage(dataUrl);

        setCreatingImage(false);
    }

    const [copied, setCopied] = useState(false);

    async function copyCurrentUrl() {
        const linkToCopy = window.location.toString();
        await copyLink(linkToCopy);

        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="App">
            <div className="main-wrapper">
                <div className="title">
                    <h1>Role Preview for the Valorant Discord servers</h1>
                    <p>
                        Preview role colors and check for possible issues with contrast and similarities with other
                        roles!
                        <br />
                        📋 Copy the website address to share your changes!
                    </p>
                    <p>
                        <strong>Note:</strong> It's normal to only reach "Passable contrast" when optimizing for both
                        dark and light theme.
                        <br />
                        <strong>Second note:</strong> For accessibility reasons, "Passable contrast" is the bare minimum
                        we need you to reach for the colour of your choice in <strong>both</strong> the dark and light
                        themes.
                    </p>
                </div>

                <div className="config">
                    <h2>Roles</h2>
                    <RoleConfigurator roles={roles} setRoles={setRoles} />
                </div>

                <div className="tools">
                    <h2>Tools</h2>

                    <div className="tool">
                        <label>
                            <Switch
                                checked={simulateColorBlindness}
                                onChange={(checked) => setSimulateColorBlindness(checked)}
                            />{" "}
                            Simulate color blindness
                        </label>

                        {simulateColorBlindness && (
                            <div className="color-blind-modes">
                                <ColorBlindModes modes={colorBlindModes} setModes={setColorBlindModes} />
                            </div>
                        )}
                    </div>

                    <div className="tool-buttons">
                        <button className="copy-link" onClick={copyCurrentUrl}>
                            {(copied && "Copied!") || "Copy link"}
                        </button>
                        <button className="download-image" onClick={generateAndDownloadImage}>
                            Download as image
                        </button>
                        <button className="reset" onClick={reset}>
                            Reset all
                        </button>
                    </div>
                </div>

                <div className="preview">
                    <h2>Preview</h2>
                    <div className="image-preview-wrapper">
                        <div className="image-preview-padding" ref={previewRef}>
                            <PreviewPane theme="dark" roles={roles} />
                            <PreviewPane theme="light" roles={roles} />

                            {Array.from(colorBlindModes).map((mode) => (
                                <div key={mode.name}>
                                    <h2>{mode.name}</h2>
                                    <PreviewPane theme="dark" roles={getColorBlindRoles(mode, roles)} />
                                    <PreviewPane theme="light" roles={getColorBlindRoles(mode, roles)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer">
                <div className="footer-content">
                    <p>
                        <a href="role-preview-for-discord.pages.dragory.net/">The original version of this tool</a>{" "}
                        <a href="https://github.com/Dragory/role-preview-for-discord">(source)</a> is created and
                        maintained by <a href="https://github.com/Dragory">Dragory</a>.
                        <br />
                        <a href="/">The version of this tool adapted for the Valorant Discord servers</a>{" "}
                        <a href="https://github.com/LilyBergonzat/role-preview-for-valcord">(source)</a> is maintained
                        by <a href="https://github.com/LilyBergonzat">Lily Bergonzat</a>.
                    </p>
                    <p>
                        <span>
                            Contrast ratio calculations are based on the{" "}
                            <a href="https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio">WCAG&nbsp;2.0</a> standard.{" "}
                        </span>
                        <span>
                            <a href="https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html">
                                For an explanation of WCAG&nbsp;2.0 contrast requirements, see this link.
                            </a>{" "}
                        </span>
                        <span>"Good" and "Great" contrast ratios pass level AA contrast requirements. </span>
                        <span>
                            "Passable" passes the <em>minimum</em> contrast level recommended by <em>ISO-9241-3</em> and{" "}
                            <em>ANSI-HFES-100-1988</em> for standard text and vision.{" "}
                        </span>
                        <span>"Lacking" is below contrast recommendations, but still somewhat readable. </span>
                        <span>"Insufficient" can be hard to read even for those with better than average vision. </span>
                    </p>
                    <p>
                        <span>Source for the prevalence numbers for the different types of color blindness: </span>
                        <br />
                        <a
                            className="allow-break"
                            href="https://www.ncbi.nlm.nih.gov/books/NBK11538/table/ch28kallcolor.T1/"
                        >
                            https://www.ncbi.nlm.nih.gov/books/NBK11538/table/ch28kallcolor.T1/
                        </a>
                    </p>
                    <p className="twemoji-info">
                        <span>
                            <a href="https://twemoji.twitter.com/">Twemoji</a> are used under the{" "}
                            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 license</a>.{" "}
                        </span>
                        <Twemoji options={{ folder: "svg", ext: ".svg" }} noWrapper={true}>
                            <span>
                                The website icon is a resized version of the <span className="nowrap">🛠 icon.</span>{" "}
                            </span>
                        </Twemoji>
                    </p>
                </div>
            </div>
        </div>
    );
}
