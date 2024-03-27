import {
	Folder,
	AchievementCategory,
	Artifact,
	Bait,
	CharacterExpMaterial,
	Character,
	Food,
	TCGCharacterCard,
	TCGMonsterCard,
	Weapon,
	WeaponEnhancementMaterial,
	WeaponPrimaryMaterial,
	WeaponSecondaryMaterial,
	CommonMaterial,
	ElementalStoneMaterial,
	Fish,
	FishingRod,
	Furnishing,
	TCGActionCard,
	TalentLvlUpMaterial,
	Potion,
	Ingredient,
	JewelMaterial,
	LocalMaterial,
} from "../data/fileReference";

const folderNameMapper = (name: string): string => {
	return safeAccess(Folder, name);
};

const fileNameMapper = (name: string, folder: string): string => {
	switch (folder) {
		case "achievementcategory":
			return safeAccess(AchievementCategory, name);
		case "artifact":
			return safeAccess(Artifact, name);
		case "bait":
			return safeAccess(Bait, name);
		case "characterexpmaterial":
			return safeAccess(CharacterExpMaterial, name);
		case "character":
			return safeAccess(Character, name);
		case "food":
			return safeAccess(Food, name);
		case "tcgcharactercard":
			return safeAccess(TCGCharacterCard, name);
		case "tcgmonstercard":
			return safeAccess(TCGMonsterCard, name);
		case "weapon":
			return safeAccess(Weapon, name);
		case "weaponenhancementmaterial":
			return safeAccess(WeaponEnhancementMaterial, name);
		case "weaponprimarymaterial":
			return safeAccess(WeaponPrimaryMaterial, name);
		case "weaponsecondarymaterial":
			return safeAccess(WeaponSecondaryMaterial, name);
		case "commonmaterial":
			return safeAccess(CommonMaterial, name);
		case "elementalstonematerial":
			return safeAccess(ElementalStoneMaterial, name);
		case "fish":
			return safeAccess(Fish, name);
		case "fishingrod":
			return safeAccess(FishingRod, name);
		case "furnishing":
			return safeAccess(Furnishing, name);
		case "tcgactioncard":
			return safeAccess(TCGActionCard, name);
		case "talentlvlupmaterial":
			return safeAccess(TalentLvlUpMaterial, name);
		case "potion":
			return safeAccess(Potion, name);
		case "ingredient":
			return safeAccess(Ingredient, name);
		case "jewelmaterial":
			return safeAccess(JewelMaterial, name);
		case "localmaterial":
			return safeAccess(LocalMaterial, name);
		default:
			throw new Error(`Folder name "${folder}" does not exist in the data repository.`);
	}
};

const referenceMapper = (name: string): any => {
	switch (name) {
		case "achievementcategory":
			return AchievementCategory;
		case "artifact":
			return Artifact;
		case "bait":
			return Bait;
		case "characterexpmaterial":
			return CharacterExpMaterial;
		case "character":
			return Character;
		case "food":
			return Food;
		case "tcgcharactercard":
			return TCGCharacterCard;
		case "tcgmonstercard":
			return TCGMonsterCard;
		case "weapon":
			return Weapon;
		case "weaponenhancementmaterial":
			return WeaponEnhancementMaterial;
		case "weaponprimarymaterial":
			return WeaponPrimaryMaterial;
		case "weaponsecondarymaterial":
			return WeaponSecondaryMaterial;
		case "commonmaterial":
			return CommonMaterial;
		case "elementalstonematerial":
			return ElementalStoneMaterial;
		case "fish":
			return Fish;
		case "fishingrod":
			return FishingRod;
		case "furnishing":
			return Furnishing;
		case "tcgactioncard":
			return TCGActionCard;
		case "talentlvlupmaterial":
			return TalentLvlUpMaterial;
		case "potion":
			return Potion;
		case "ingredient":
			return Ingredient;
		case "jewelmaterial":
			return JewelMaterial;
		case "localmaterial":
			return LocalMaterial;
		default:
			throw new Error(`Folder name "${name}" does not exist in the data repository.`);
	}
};

const safeAccess = <T extends object>(obj: T, propName: string): string => {
	if (!(propName in obj)) {
		throw new Error(`Property name "${propName}" does not exist in the data repository.`);
	}
	return obj[propName as keyof T] as string;
};
export { folderNameMapper, fileNameMapper, referenceMapper };
