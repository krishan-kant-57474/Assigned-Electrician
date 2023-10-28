import React, { useState } from "react";
import { Table, DatePicker, Switch, Tag, Button } from "antd";
import rawSiteData from "./json/rawSiteData.json";
import electrician from "./json/electricianData.json";
import dayjs from "dayjs";

const MyTable = () => {
	const [data, setData] = useState(rawSiteData);

	const columns = [
		{
			title: "Name",
			dataIndex: "name",
		},
		{
			title: "Phone",
			dataIndex: "phone",
		},
		{
			title: "City",
			dataIndex: "city",
		},
		{
			title: "Assigned Electrician",
			dataIndex: "AssignedElectritian",
			render: (text) => {
				return (
					<div>
						{text && text.length > 0 ? (
							text.map((elec, index) => (
								<div key={index}>
									<Tag color="blue">
										{elec.electricianName} - {elec.electricianAssignDate}
									</Tag>
								</div>
							))
						) : (
							<Tag color="red">Not Assigned</Tag>
						)}
					</div>
				);
			},
		},
		{
			title: "Installation Date",
			dataIndex: "InstallationDate",
			render: (text, record) => {
				return (
					<DatePicker
						value={text ? dayjs(text) : null}
						onChange={(date) => handleDateChange(record, date)}
					/>
				);
			},
		},
		{
			title: "Grievance",
			dataIndex: "grievance",
			render: (text, record) => (
				<Switch
					checkedChildren="Grievance"
					unCheckedChildren="General"
					checked={text}
					onChange={(checked) => handleGrievanceChange(record, checked)}
				/>
			),
		},
	];

	const handleGrievanceChange = (record, checked) => {
		const newData = data.map((item) => {
			if (item.name === record.name) {
				return { ...item, grievance: checked };
			}
			return item;
		});
		setData(newData);
	};

	const handleDateChange = (record, date) => {
		const newData = data.map((item) => {
			if (item.name === record.name) {
				return { ...item, InstallationDate: date ? date.toISOString() : null };
			}
			return item;
		});
		setData(newData);
	};

	const handleAutoAssign2 = () => {
		const maxAssignmentsPerElectrician = 3;
		data.forEach((site) => {
			site.AssignedElectritian = [];
		});

		const electricianAssignments = {};

		const grievanceSites = data.filter((site) => site.grievance);
		const generalSites = data.filter((site) => !site.grievance);

		grievanceSites.forEach((site) => {
			if (site.AssignedElectritian.length < maxAssignmentsPerElectrician) {
				const grievanceElectrician = electrician.find(
					(elec) =>
						elec.grievanceElectrician &&
						(electricianAssignments[elec.name] || 0) <
							maxAssignmentsPerElectrician
				);

				if (grievanceElectrician) {
					site.AssignedElectritian.push({
						electricianName: grievanceElectrician.name,
						electricianAssignDate: new Date().toISOString(),
					});
					electricianAssignments[grievanceElectrician.name] =
						(electricianAssignments[grievanceElectrician.name] || 0) + 1;
					grievanceElectrician.AssignedTo = site.name;
				}
			}
		});

		generalSites.forEach((site) => {
			if (site.AssignedElectritian.length < maxAssignmentsPerElectrician) {
				const generalElectrician = electrician.find(
					(elec) =>
						!elec.grievanceElectrician &&
						(electricianAssignments[elec.name] || 0) <
							maxAssignmentsPerElectrician
				);

				if (!generalElectrician) {
					const availableGrievanceElectricians = electrician.filter(
						(elec) =>
							elec.grievanceElectrician &&
							(electricianAssignments[elec.name] || 0) <
								maxAssignmentsPerElectrician
					);

					if (availableGrievanceElectricians.length > 0) {
						const grievanceElectrician = availableGrievanceElectricians[0];
						site.AssignedElectritian.push({
							electricianName: grievanceElectrician.name,
							electricianAssignDate: new Date().toISOString(),
						});
						electricianAssignments[grievanceElectrician.name] =
							(electricianAssignments[grievanceElectrician.name] || 0) + 1;
						grievanceElectrician.AssignedTo = site.name;
					}
				} else {
					site.AssignedElectritian.push({
						electricianName: generalElectrician.name,
						electricianAssignDate: new Date().toISOString(),
					});
					electricianAssignments[generalElectrician.name] =
						(electricianAssignments[generalElectrician.name] || 0) + 1;
					generalElectrician.AssignedTo = site.name;
				}
			}
		});

		const unassignedElectricians = electrician.filter(
			(elec) => !electricianAssignments[elec.name]
		);

		const pendingSites = data.filter(
			(site) => site.AssignedElectritian.length < maxAssignmentsPerElectrician
		);

		if (unassignedElectricians.length > 0 && pendingSites.length > 0) {
			const unassignedGrievanceElectricians = unassignedElectricians.filter(
				(elec) => elec.grievanceElectrician
			);

			const unassignedGeneralElectricians = unassignedElectricians.filter(
				(elec) => !elec.grievanceElectrician
			);

			unassignedGrievanceElectricians.forEach((grievanceElec) => {
				if (pendingSites.length > 0) {
					const pendingSite = pendingSites.shift();
					pendingSite.AssignedElectritian.push({
						electricianName: grievanceElec.name,
						electricianAssignDate: new Date().toISOString(),
					});
					electricianAssignments[grievanceElec.name] =
						(electricianAssignments[grievanceElec.name] || 0) + 1;
					grievanceElec.AssignedTo = pendingSite.name;
				}
			});

			unassignedGeneralElectricians.forEach((generalElec) => {
				if (pendingSites.length > 0) {
					const pendingSite = pendingSites.shift();
					pendingSite.AssignedElectritian.push({
						electricianName: generalElec.name,
						electricianAssignDate: new Date().toISOString(),
					});
					electricianAssignments[generalElec.name] =
						(electricianAssignments[generalElec.name] || 0) + 1;
					generalElec.AssignedTo = pendingSite.name;
				}
			});
		}

		setData([...data]);
	};

	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		height: "100vh",
		backgroundColor: "gray",
	};

	const titleStyle = {
		fontSize: "24px",
		fontWeight: "bold",
		marginBottom: "10px",
	};

	return (
		<div style={containerStyle}>
			<Button onClick={handleAutoAssign2}>Auto Assign Electricians</Button>
			<div style={titleStyle}>Table Title</div>
			<Table
				dataSource={data}
				columns={columns}
				rowKey={(record) => record.name}
				size="small"
				style={{ width: "80%" }}
			/>
		</div>
	);
};

export default MyTable;
