import { Option, Step, ThemeTemplateGroup, useZakeke } from '@zakeke/zakeke-configurator-react';
import { T, useActualGroups, useUndoRedoActions, useUndoRegister } from 'Helpers';
import { Map } from 'immutable';
import { useEffect, useState } from 'react';
import useStore from 'Store';
import styled from 'styled-components';
import savedCompositionsIcon from '../../assets/icons/saved_designs.svg';
import star from '../../assets/icons/star.svg';
import noImage from '../../assets/images/no_image.png';
import Designer from '../layout/Designer';
import DesignsDraftList from '../layout/DesignsDraftList';
import { ItemName, Template, TemplatesContainer } from '../layout/SharedComponents';
import Steps from '../layout/Steps';
import {
	AttributeHeaderBar,
	AttributeHeaderIcon,
	AttributeTitle,
	HeaderNavButton,
	MenuItem,
	MobileItemsContainer,
	OptionSwatch,
	OptionSwatchCheck,
	OptionsGrid
} from './MobileMenuComponents';
import TemplateGroup from 'components/TemplateGroup';
import { ReactComponent as CheckIcon } from '../../assets/icons/check-solid.svg';

// Styled component for the container of the mobile menu
export const MobileMenuContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	width: 100%;
	position: relative;
	overflow: auto;
`;

// Styled component for the container of the steps
export const StepsMobileContainer = styled.div`
	border-top: 1px #fff solid;
	height: 45px;
`;

// Styled component for the container of the price info text
const PriceInfoTextContainer = styled.div`
	font-size: 14px;
	padding: 0px 10px;
`;

// MobileMenu component that represents the mobile menu where
// the customer can select the attributes and options
const MobileMenu = () => {
	const {
		isSceneLoading,
		templates,
		currentTemplate,
		setCamera,
		setTemplate,
		sellerSettings,
		selectOption,
		draftCompositions
	} = useZakeke();
	const {
		selectedGroupId,
		setSelectedGroupId,
		selectedAttributeId,
		setSelectedAttributeId,
		selectedStepId,
		setSelectedStepId,
		isUndo,
		isRedo,
		setSelectedTemplateGroupId,
		selectedTemplateGroupId,
		lastSelectedItem,
		setLastSelectedItem
	} = useStore();
	const [scrollLeft, setScrollLeft] = useState<number | null>(null);
	const [optionsScroll, setOptionsScroll] = useState<number | null>(null);
	const [attributesScroll, setAttributesScroll] = useState<number | null>(null);
	const [isTemplateEditorOpened, setIsTemplateEditorOpened] = useState(false);
	const [isDesignsDraftListOpened, setisDesignsDraftListOpened] = useState(false);
	const [isTemplateGroupOpened, setIsTemplateGroupOpened] = useState(false);
	const [isStartRegistering, setIsStartRegistering] = useState(false);
	const undoRegistering = useUndoRegister();
	const undoRedoActions = useUndoRedoActions();

	const actualGroups = useActualGroups() ?? [];

	const selectedGroup = selectedGroupId ? actualGroups.find((group) => group.id === selectedGroupId) : null;
	const selectedStep = selectedGroupId
		? actualGroups.find((group) => group.id === selectedGroupId)?.steps.find((step) => step.id === selectedStepId)
		: null;
	const currentAttributes = selectedStep ? selectedStep.attributes : selectedGroup ? selectedGroup.attributes : [];
	const currentTemplateGroups = selectedStep
		? selectedStep.templateGroups
		: selectedGroup
		? selectedGroup.templateGroups
		: [];

	const currentItems = [...currentAttributes, ...currentTemplateGroups].sort(
		(a, b) => a.displayOrder - b.displayOrder
	);

	const selectedAttribute = currentAttributes
		? currentAttributes.find((attr) => attr.id === selectedAttributeId)
		: null;

	const selectedTemplateGroup = currentTemplateGroups
		? currentTemplateGroups.find((templGr) => templGr.templateGroupID === selectedTemplateGroupId)
		: null;

	const options = selectedAttribute?.options ?? [];
	const groupIndex = actualGroups && selectedGroup ? actualGroups.indexOf(selectedGroup) : 0;

	const [lastSelectedSteps, setLastSelectedSteps] = useState(Map<number, number>());

	const handleNextGroup = () => {
		if (selectedGroup) {
			if (groupIndex < actualGroups.length - 1) {
				const nextGroup = actualGroups[groupIndex + 1];
				handleGroupSelection(nextGroup.id);
			}
		}
	};

	const handlePreviousGroup = () => {
		if (selectedGroup) {
			if (groupIndex > 0) {
				let previousGroup = actualGroups[groupIndex - 1];
				handleGroupSelection(previousGroup.id);

				// Select the last step
				if (previousGroup.steps.length > 0)
					handleStepSelection(previousGroup.steps[previousGroup.steps.length - 1].id);
				else if (previousGroup.attributes.length > 0)
					handleAttributeSelection(previousGroup.attributes[previousGroup.attributes.length - 1].id);
				else if (previousGroup.templateGroups.length > 0)
					handleTemplateGroupSelection(
						previousGroup.templateGroups[previousGroup.templateGroups.length - 1].templateGroupID
					);
			}
		}
	};

	const handleStepChange = (step: Step | null) => {
		if (step) handleStepSelection(step.id);
	};

	const handleGroupSelection = (groupId: number | null) => {
		setIsStartRegistering(undoRegistering.startRegistering());

		if (groupId && selectedGroupId !== groupId && !isUndo && !isRedo) {
			undoRedoActions.eraseRedoStack();
			undoRedoActions.fillUndoStack({ type: 'group', id: selectedGroupId, direction: 'undo' });
			undoRedoActions.fillUndoStack({ type: 'group', id: groupId, direction: 'redo' });
		}

		setSelectedGroupId(groupId);
		//Reset scrollbar for iphone bug
		setScrollLeft(0);
		setAttributesScroll(0);
		setOptionsScroll(0);
	};

	const handleStepSelection = (stepId: number | null) => {
		setIsStartRegistering(undoRegistering.startRegistering());

		if (selectedStepId !== stepId && !isUndo && !isRedo) {
			undoRedoActions.eraseRedoStack();
			undoRedoActions.fillUndoStack({ type: 'step', id: selectedStepId, direction: 'undo' });
			undoRedoActions.fillUndoStack({ type: 'step', id: stepId ?? null, direction: 'redo' });
		}

		setSelectedStepId(stepId);

		const newStepSelected = lastSelectedSteps.set(selectedGroupId!, stepId!);
		setLastSelectedSteps(newStepSelected);
		//Reset scrollbar for iphone bug
		setScrollLeft(0);
		setAttributesScroll(0);
		setOptionsScroll(0);
	};

	const handleAttributeSelection = (attributeId: number) => {
		setIsStartRegistering(undoRegistering.startRegistering());

		if (attributeId && selectedAttributeId !== attributeId && !isUndo && !isRedo) {
			undoRedoActions.eraseRedoStack();
			undoRedoActions.fillUndoStack({ type: 'attribute', id: selectedAttributeId, direction: 'undo' });
			undoRedoActions.fillUndoStack({ type: 'attribute', id: attributeId, direction: 'redo' });
		}

		setSelectedAttributeId(attributeId);
		setLastSelectedItem({ type: 'attribute', id: attributeId });
		//Reset scrollbar for iphone bug
		setScrollLeft(0);
		setAttributesScroll(0);
		setOptionsScroll(0);
	};

	const handleTemplateGroupSelection = (templateGroupId: number | null) => {
		setSelectedTemplateGroupId(templateGroupId);
		setLastSelectedItem({ type: 'template-group', id: templateGroupId });
		setIsTemplateGroupOpened(true);
	};

	const handleOptionSelection = (option: Option) => {
		const undo = undoRegistering.startRegistering();
		undoRedoActions.eraseRedoStack();
		undoRedoActions.fillUndoStack({
			type: 'option',
			id: options.find((opt) => opt.selected)?.id ?? null,
			direction: 'undo'
		});
		undoRedoActions.fillUndoStack({ type: 'option', id: option.id, direction: 'redo' });

		selectOption(option.id);
		undoRegistering.endRegistering(undo);

		try {
			if ((window as any).algho) (window as any).algho.sendUserStopForm(true);
		} catch (e) {}
	};

	const setTemplateByID = async (templateID: number) => await setTemplate(templateID);
	// Initial template selection
	useEffect(() => {
		if (templates.length > 0 && !currentTemplate) setTemplateByID(templates[0].id);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [templates]);

	// auto-selection: open first real group on mobile load (skip designer/-2, drafts/-3)
	useEffect(() => {
		if (!actualGroups || actualGroups.length === 0) return;
		if (selectedGroupId) return;

		const firstRealGroup = actualGroups.find((g) => g.id > 0) ?? actualGroups[0];
		if (firstRealGroup && firstRealGroup.id !== -2) {
			// console.log('[MobileMenu] auto-selecting first group', firstRealGroup);
			setSelectedGroupId(firstRealGroup.id);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [actualGroups, selectedGroupId]);

	// auto-selection: pick first attribute of first step whenever a group is opened
	// and the current selectedAttributeId is missing or stale (belongs to a previous group)
	useEffect(() => {
		if (!selectedGroup || selectedGroup.id < 0) return;

		const attrBelongsToGroup =
			selectedAttributeId != null && currentAttributes.some((a) => a.id === selectedAttributeId);
		if (attrBelongsToGroup) return;

		const step = selectedStep ?? (selectedGroup.steps?.length ? selectedGroup.steps[0] : null);
		const firstAttribute =
			(step && step.attributes && step.attributes[0]) ||
			(selectedGroup.attributes && selectedGroup.attributes[0]);

		if (firstAttribute) {
			// console.log('[MobileMenu] auto-selecting first attribute', {
			// 	group: selectedGroup.name,
			// 	step: step?.name,
			// 	attribute: firstAttribute.name,
			// 	optionsCount: firstAttribute.options?.length,
			// 	staleAttrId: selectedAttributeId
			// });
			setTimeout(() => handleAttributeSelection(firstAttribute.id), 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedGroup?.id, selectedStep?.id, selectedAttributeId, currentAttributes.length]);

	// Reset attribute selection when group selection changes
	useEffect(() => {
		if (selectedGroup && selectedGroup.id !== -2) {
			if (selectedGroup.steps.length > 0) {
				if (
					lastSelectedSteps.get(selectedGroupId!) &&
					selectedGroup.steps.find((step) => step.id === lastSelectedSteps.get(selectedGroupId!)!)
				)
					handleStepSelection(lastSelectedSteps.get(selectedGroupId!)!);
				else {
					handleStepSelection(selectedGroup.steps[0].id);
					if (
						selectedGroup.steps[0].attributes.length === 1 &&
						selectedGroup.steps[0].templateGroups.length === 0
					)
						handleAttributeSelection(selectedGroup.steps[0].attributes[0].id);
					else if (
						selectedGroup.steps[0].templateGroups.length === 1 &&
						selectedGroup.steps[0].attributes.length === 0
					)
						handleTemplateGroupSelection(selectedGroup.steps[0].templateGroups[0].templateGroupID);
				}
			} else {
				handleStepSelection(null);
				if (selectedGroup.attributes.length === 1 && selectedGroup.templateGroups.length === 0)
					handleAttributeSelection(selectedGroup.attributes[0].id);
				else if (selectedGroup.templateGroups.length === 1 && selectedGroup.attributes.length === 0)
					handleTemplateGroupSelection(selectedGroup.templateGroups[0].templateGroupID);
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedGroup?.id]);

	useEffect(() => {
		if (selectedGroup?.id === -2) {
			setIsTemplateEditorOpened(true);
		}
	}, [selectedGroup?.id]);

	useEffect(() => {
		if (selectedGroup?.id === -3) {
			setisDesignsDraftListOpened(true);
		}
	}, [selectedGroup?.id]);

	// Camera
	useEffect(() => {
		if (!isSceneLoading && selectedGroup && selectedGroup.cameraLocationId) {
			setCamera(selectedGroup.cameraLocationId, false);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedGroup?.id, isSceneLoading]);

	useEffect(() => {
		if (selectedGroup && selectedGroup.steps.length > 0) {
			if (
				selectedGroup.steps.find((step) => step.id === selectedStep?.id) &&
				selectedGroup.steps.find((step) => step.id === selectedStep?.id)?.attributes.length === 1 &&
				selectedGroup.steps.find((step) => step.id === selectedStep?.id)?.templateGroups.length === 0
			)
				handleAttributeSelection(
					selectedGroup.steps!.find((step) => step.id === selectedStep?.id)!.attributes[0].id
				);
			else setSelectedAttributeId(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedStep?.id]);

	useEffect(() => {
		if (isStartRegistering) {
			undoRegistering.endRegistering(false);
			setIsStartRegistering(false);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isStartRegistering]);

	const attributeIndex = selectedAttributeId
		? currentAttributes.findIndex((a) => a.id === selectedAttributeId)
		: -1;

	const groupSteps = selectedGroup?.steps ?? [];
	const stepIndex = selectedStep ? groupSteps.indexOf(selectedStep) : -1;

	const canStepAttribute = (dir: 1 | -1) => {
		if (dir === 1) {
			if (attributeIndex >= 0 && attributeIndex < currentAttributes.length - 1) return true;
			if (stepIndex >= 0 && stepIndex < groupSteps.length - 1) return true;
			return groupIndex < actualGroups.length - 1;
		}
		if (attributeIndex > 0) return true;
		if (stepIndex > 0) return true;
		return groupIndex > 0;
	};

	const selectAttributeAfterStep = (attributeId: number) => {
		// The selectedStep effect clears selectedAttributeId when the new step
		// has more than one attribute — defer so our selection wins.
		setTimeout(() => handleAttributeSelection(attributeId), 0);
	};

	const handleAttributeStep = (dir: 1 | -1) => {
		// console.log('[MobileMenu] handleAttributeStep', {
		// 	dir,
		// 	attributeIndex,
		// 	currentAttributesCount: currentAttributes.length,
		// 	stepIndex,
		// 	stepsCount: groupSteps.length,
		// 	groupIndex,
		// 	groupsCount: actualGroups.length
		// });
		if (dir === 1) {
			if (attributeIndex >= 0 && attributeIndex < currentAttributes.length - 1) {
				handleAttributeSelection(currentAttributes[attributeIndex + 1].id);
				return;
			}
			if (stepIndex >= 0 && stepIndex < groupSteps.length - 1) {
				const nextStep = groupSteps[stepIndex + 1];
				handleStepSelection(nextStep.id);
				if (nextStep.attributes.length > 0) selectAttributeAfterStep(nextStep.attributes[0].id);
				return;
			}
			handleNextGroup();
		} else {
			if (attributeIndex > 0) {
				handleAttributeSelection(currentAttributes[attributeIndex - 1].id);
				return;
			}
			if (stepIndex > 0) {
				const prevStep = groupSteps[stepIndex - 1];
				handleStepSelection(prevStep.id);
				if (prevStep.attributes.length > 0)
					selectAttributeAfterStep(prevStep.attributes[prevStep.attributes.length - 1].id);
				return;
			}
			handlePreviousGroup();
		}
	};
	// console.log('[MobileMenu] render', {
	// 	selectedGroup: selectedGroup?.name,
	// 	selectedGroupId,
	// 	selectedStep: selectedStep?.name,
	// 	selectedStepId,
	// 	selectedAttribute: selectedAttribute?.name,
	// 	selectedAttributeId,
	// 	lastSelectedItem,
	// 	currentAttributes: currentAttributes.map((a) => ({ id: a.id, name: a.name, opts: a.options?.length })),
	// 	options: options.map((o) => ({ id: o.id, name: o.name, enabled: o.enabled, selected: o.selected }))
	// });

	return (
		<MobileMenuContainer>
			{sellerSettings && sellerSettings.priceInfoText && (
				<PriceInfoTextContainer dangerouslySetInnerHTML={{ __html: sellerSettings.priceInfoText }} />
			)}

			{selectedGroup && selectedGroup.id !== -2 && selectedGroup.steps && selectedGroup.steps.length > 0 && (
				<StepsMobileContainer>
					<Steps
						key={'steps-' + selectedGroup?.id}
						hasNextGroup={groupIndex !== actualGroups.length - 1}
						hasPreviousGroup={groupIndex !== 0}
						onNextStep={handleNextGroup}
						onPreviousStep={handlePreviousGroup}
						currentStep={selectedStep}
						steps={selectedGroup.steps}
						onStepChange={handleStepChange}
					/>
				</StepsMobileContainer>
			)}
			{selectedGroup == null && (
				<MobileItemsContainer
					isLeftArrowVisible
					isRightArrowVisible
					scrollLeft={scrollLeft ?? 0}
					onScrollChange={(value) => setScrollLeft(value)}
				>
					{actualGroups.map((group) => {
						if (group)
							return (
								<MenuItem
									key={group.guid}
									imageUrl={
										group.id === -3 ? savedCompositionsIcon : group.imageUrl ? group.imageUrl : star
									}
									label={group.name ? T._d(group.name) : T._('Customize', 'Composer')}
									onClick={() => handleGroupSelection(group.id)}
								></MenuItem>
							);
						else return null;
					})}
				</MobileItemsContainer>
			)}

			{/* <AttributesContainer > */}
			{selectedGroup && selectedGroup.id === -2 && templates.length > 1 && (
				<TemplatesContainer>
					{templates.map((template) => (
						<Template
							key={template.id}
							selected={currentTemplate === template}
							onClick={async () => {
								await setTemplate(template.id);
							}}
						>
							{T._d(template.name)}
						</Template>
					))}
				</TemplatesContainer>
			)}
			{selectedGroup && lastSelectedItem?.type === 'attribute' && selectedAttribute && (
				<>
					<AttributeHeaderBar>
						<AttributeHeaderIcon>
							<img
								src={selectedGroup.imageUrl ? selectedGroup.imageUrl : star}
								alt={T._d(selectedAttribute.name)}
							/>
						</AttributeHeaderIcon>
						<AttributeTitle>{T._d(selectedAttribute.name)}</AttributeTitle>
						<HeaderNavButton
							type='button'
							onClick={() => handleAttributeStep(-1)}
							disabled={!canStepAttribute(-1)}
						>
							{T._('Prev', 'Composer')}
						</HeaderNavButton>
						<HeaderNavButton
							type='button'
							primary
							onClick={() => handleAttributeStep(1)}
							disabled={!canStepAttribute(1)}
						>
							{T._('Next', 'Composer')}
						</HeaderNavButton>
					</AttributeHeaderBar>

					<OptionsGrid>
						{selectedAttribute.options.map(
							(option) =>
								option.enabled && (
									<OptionSwatch
										key={option.guid}
										isRound={selectedAttribute.optionShapeType === 2}
										selected={option.selected}
										onClick={() => handleOptionSelection(option)}
									>
										<img src={option.imageUrl ?? noImage} alt={T._d(option.name)} loading='lazy' />
										{option.selected && (
											<OptionSwatchCheck>
												<CheckIcon />
											</OptionSwatchCheck>
										)}
									</OptionSwatch>
								)
						)}
					</OptionsGrid>
				</>
			)}

			{selectedGroup && (!lastSelectedItem || lastSelectedItem?.type !== 'attribute') && (
				<MobileItemsContainer
					isLeftArrowVisible
					isRightArrowVisible
					scrollLeft={attributesScroll ?? 0}
					onScrollChange={(value) => setAttributesScroll(value)}
				>
					{/* Attributes */}

					{selectedGroup &&
						!selectedAttributeId &&
						!selectedTemplateGroupId &&
						currentItems &&
						currentItems.map((item) => {
							if (!(item instanceof ThemeTemplateGroup))
								return (
									<MenuItem
										selected={item.id === selectedAttributeId}
										key={item.guid}
										onClick={() => handleAttributeSelection(item.id)}
										images={item.options
											.slice(0, 4)
											.map((x) => (x.imageUrl ? x.imageUrl : noImage))}
										label={T._d(item.name)}
										isRound={item.optionShapeType === 2}
									>
										<ItemName> {T._d(item.name).toUpperCase()} </ItemName>
									</MenuItem>
								);
							else
								return (
									<MenuItem
										selected={item.templateGroupID === selectedTemplateGroupId}
										key={item.templateGroupID}
										onClick={() => handleTemplateGroupSelection(item.templateGroupID)}
										imageUrl={noImage}
										label={T._d(item.name)}
										isRound={false}
									>
										<ItemName> {T._d(item.name).toUpperCase()} </ItemName>
									</MenuItem>
								);
						})}

					<MobileItemsContainer
						isLeftArrowVisible={options.length !== 0}
						isRightArrowVisible={options.length !== 0}
						scrollLeft={optionsScroll ?? 0}
						onScrollChange={(value) => setOptionsScroll(value)}
					>
						{selectedTemplateGroup && isTemplateGroupOpened && (
							<TemplateGroup
								key={selectedTemplateGroupId}
								templateGroup={selectedTemplateGroup!}
								isMobile
								onCloseClick={() => {
									setIsTemplateGroupOpened(false);
									handleTemplateGroupSelection(null);
									handleGroupSelection(null);
								}}
							/>
						)}
					</MobileItemsContainer>
				</MobileItemsContainer>
			)}

			{/* Designer / Customizer */}
			{selectedGroup?.id === -2 && isTemplateEditorOpened && (
				<Designer
					onCloseClick={() => {
						setIsTemplateEditorOpened(false);
						handleGroupSelection(null);
					}}
				/>
			)}

			{/* Saved Compositions */}
			{draftCompositions && selectedGroup?.id === -3 && isDesignsDraftListOpened && (
				<DesignsDraftList
					onCloseClick={() => {
						setIsTemplateEditorOpened(false);
						handleGroupSelection(null);
					}}
				/>
			)}
		</MobileMenuContainer>
	);
};

export default MobileMenu;
