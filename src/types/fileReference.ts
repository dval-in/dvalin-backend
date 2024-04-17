export const dataTypeList = [
	'AchievementCategory',
	'Artifact',
	'Bait',
	'Character',
	'CharacterExpMaterial',
	'CommonMaterial',
	'ElementalStoneMaterial',
	'Event',
	'Fish',
	'FishingRod',
	'Food',
	'Furnishing',
	'Ingredient',
	'JewelMaterial',
	'LocalMaterial',
	'Potion',
	'TCGActionCard',
	'TCGCharacterCard',
	'TCGMonsterCard',
	'TalentLvlUpMaterial',
	'Weapon',
	'WeaponEnhancementMaterial',
	'WeaponPrimaryMaterial',
	'WeaponSecondaryMaterial'
];

export type DataTypeKey = (typeof dataTypeList)[number];

export const isDataTypeKey = (key: string): key is DataTypeKey => {
	return dataTypeList.includes(key);
};
