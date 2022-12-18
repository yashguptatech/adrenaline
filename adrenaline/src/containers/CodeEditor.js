import React, { Component } from "react";
import {Controlled as CodeMirror} from 'react-codemirror2';
import { aura } from "@uiw/codemirror-theme-aura";

import Button from "../components/Button";

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

import "./CodeEditor.css";

require('codemirror/mode/python/python');

export default class CodeEditor extends Component {
	constructor(props) {
		super(props);

		// this.state = {diffWidgets: {}}
		this.diffWidgets = {}
	}

	addDiffWidget = (insertLine, isFixedCode, onClickUseMe) => {
		let useMeHeader = document.createElement("div");
		let useMeButton = document.createElement("div");
		let useMeLabel = document.createElement("span");

		useMeHeader.className = "useMeHeader";
		useMeButton.className = "useMeButton";
		useMeButton.innerHTML = "Use me";
		useMeButton.onclick = onClickUseMe;
		useMeLabel.className = "useMeLabel";
		useMeLabel.innerHTML = isFixedCode ? "fixed code" : "your code";

		useMeHeader.appendChild(useMeButton);
		useMeHeader.appendChild(useMeLabel);

		return this.codeMirrorRef.addLineWidget(insertLine, useMeHeader, { above: !isFixedCode });
	}

	deleteDiffWidgets = codeChangeIndex => {
		if (codeChangeIndex in this.diffWidgets) {
			this.diffWidgets[codeChangeIndex].oldCodeWidget.clear();
			this.diffWidgets[codeChangeIndex].newCodeWidget.clear();
		}
	}

	addCodeChangeDiffs = (codeChanges, onClickUseMe) => {
		codeChanges.forEach((codeChange, index) => {
			const { oldLines, newLines, mergeLine } = codeChange;

			oldLines.forEach((lineNum, index) => {
				if (index === 0) {
						this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine first");
				} else {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine");
				}
			});
			this.codeMirrorRef.addLineClass(mergeLine, "wrap", "mergeLine");
			newLines.forEach((lineNum, index) => {
				if (index === newLines.length) {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine last");
				} else {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine");
				}
			});

			let oldCodeWidget = this.addDiffWidget(oldLines.at(0), false, () => {
				onClickUseMe(newLines, index, this.codeMirrorRef, codeChange);
				this.deleteDiffWidgets(index);
			});
			let newCodeWidget = this.addDiffWidget(newLines.at(-1) + 1, true, () => {
				onClickUseMe(oldLines, index, this.codeMirrorRef, codeChange);
				this.deleteDiffWidgets(index);
			});

			this.diffWidgets[index] = {oldCodeWidget, newCodeWidget};
		});
	}

	componentDidUpdate() {
		const { codeChanges, onClickUseMe } = this.props;

		codeChanges.forEach((codeChange, index) => {
			const { oldLines, newLines, mergeLine } = codeChange;

			// Delete the diff decoration
	    oldLines.map((oldLine, index) => {
	      let className = "oldLine";
	      className += index === 0 ? " first" : "";
	      this.codeMirrorRef.removeLineClass(index, "wrap", className);
	    });
	    newLines.map((newLine, index) => {
	      let className = "newLine";
	      className += index === codeChange.newLines.length - 1 ? " last" : "";
	      this.codeMirrorRef.removeLineClass(index, "wrap", className);
	    });
	    this.codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");

			this.deleteDiffWidgets(index);
		});

		this.addCodeChangeDiffs(codeChanges, onClickUseMe);
	}

	render() {
		const { code, codeChanges, onChange, onClickUseMe, onSaveFile } = this.props;

		console.log("Rendering")
		console.log(codeChanges);

		return (
			<CodeMirror
				className="codeEditor"
			  value={code.join("\n")}
			  options={{
					mode: "python",
					theme: "dracula",
			    lineNumbers: true
			  }}
			  onBeforeChange={(editor, data, strCode) => onChange(strCode)}
				onChange={(editor, data, strCode) => { onChange(strCode); }}
				editorDidMount={editor => {
					this.codeMirrorRef = editor;
					this.addCodeChangeDiffs(codeChanges, onClickUseMe);
				}}
				onKeyDown={(editor, event) => {
					const isSaveKey = event.which == 83 && (event.ctrlKey || event.metaKey);
					if (isSaveKey) {
						event.preventDefault();
						onSaveFile();

						return false;
					}

					return true;
				}}
			/>
	  );
	}
}
