import React, { useEffect, useState, useContext } from "react";
import styles from "../styles/Components.module.css";
import { Page, Bar, Title, Toolbar, ToolbarSpacer, Label, Select, Option, FlexBox, Text } from "@ui5/webcomponents-react";
import { DbContext } from "../contexts/dbContext.jsx";

export function Configuracion() {
    const {dbServer, setdbServer} = useContext(DbContext);

	const handleSelectChange = (e) => {
		const selectedOption = e.detail && e.detail.selectedOption;
		const value = selectedOption ? selectedOption.textContent : null;
		if (value) setdbServer(value);
	};

	return (
		<Page className={styles.pageContainer}>
			<Bar>
				<Title>Configuración</Title>
			</Bar>

			<Toolbar style={{ margin: "1rem 0" }}>
				<Label>Servidor DB:</Label>
				<ToolbarSpacer />
				<Select value={dbServer} onChange={handleSelectChange} style={{ minWidth: 180 }}>
					<Option key="MongoDB">MongoDB</Option>
					<Option key="AZURECOSMOS">AZURECOSMOS</Option>
				</Select>
			</Toolbar>

		</Page>
	);
}

