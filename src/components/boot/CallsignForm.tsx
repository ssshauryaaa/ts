import React, { useRef, useState } from "react";
import styles from "./CallsignForm.module.css";

export function CallsignForm({
  visible,
  onSubmit,
}: {
  visible: boolean;
  onSubmit: (v: string) => void;
}) {
  const [callsign, setCallsign] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ready = callsign.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready) onSubmit(callsign.trim());
  };

  return (
    <form
      className={styles.form}
      data-visible={visible}
      onSubmit={handleSubmit}
      aria-hidden={!visible}
    >
      <label htmlFor="callsign" className={styles.label}>
        IDENTIFIER_REQUIRED
      </label>

      <div className={styles.line} data-focused={focused} onClick={() => inputRef.current?.focus()}>
        <span className={styles.prompt} aria-hidden="true">
          &gt;
        </span>

        <input
          ref={inputRef}
          id="callsign"
          type="text"
          className={styles.input}
          placeholder="ENTER_CALLSIGN"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          spellCheck={false}
          tabIndex={visible ? 0 : -1}
          autoFocus={visible}
        />

        <button type="submit" className={styles.transmit} disabled={!ready} tabIndex={visible ? 0 : -1}>
          [&nbsp;TRANSMIT&nbsp;]
        </button>

        <span className={styles.baseline} aria-hidden="true" />
      </div>
    </form>
  );
}