// 栄養素の一般的な働き。
// 文言は消費者庁「栄養機能食品」で認められている表示の言い回しを基準にし、
// それ以外の成分は事実の説明にとどめる。料理そのものの効果を示すものではない。

export type NutrientKey =
  | 'protein' | 'vitA' | 'vitB1' | 'vitB2' | 'vitB6' | 'vitB12' | 'niacin' | 'biotin' | 'folate'
  | 'vitC' | 'vitD' | 'vitE' | 'iron' | 'zinc' | 'calcium' | 'magnesium' | 'potassium' | 'fiber' | 'n3';

export interface Nutrient {
  ja: string;
  en: string;
  role: string;
  /** 美容との関わりが栄養機能表示で示されているか(皮膚・粘膜など) */
  beauty: boolean;
}

export const NUTRIENTS: Record<NutrientKey, Nutrient> = {
  protein: { ja: 'たんぱく質', en: 'Protein', beauty: true, role: '筋肉・皮膚・髪・爪など、体の組織をつくる材料になる栄養素です。' },
  vitA: { ja: 'ビタミンA', en: 'Vitamin A', beauty: true, role: '夜間の視力の維持を助けるとともに、皮膚や粘膜の健康維持を助ける栄養素です。' },
  vitB1: { ja: 'ビタミンB1', en: 'Vitamin B1', beauty: true, role: '炭水化物からのエネルギーの産生と、皮膚や粘膜の健康維持を助ける栄養素です。' },
  vitB2: { ja: 'ビタミンB2', en: 'Vitamin B2', beauty: true, role: '皮膚や粘膜の健康維持を助ける栄養素です。' },
  vitB6: { ja: 'ビタミンB6', en: 'Vitamin B6', beauty: true, role: 'たんぱく質からのエネルギーの産生と、皮膚や粘膜の健康維持を助ける栄養素です。' },
  vitB12: { ja: 'ビタミンB12', en: 'Vitamin B12', beauty: false, role: '赤血球の形成を助ける栄養素です。' },
  niacin: { ja: 'ナイアシン', en: 'Niacin', beauty: true, role: '皮膚や粘膜の健康維持を助ける栄養素です。' },
  biotin: { ja: 'ビオチン', en: 'Biotin', beauty: true, role: '皮膚や粘膜の健康維持を助ける栄養素です。' },
  folate: { ja: '葉酸', en: 'Folate', beauty: false, role: '赤血球の形成を助ける栄養素です。' },
  vitC: { ja: 'ビタミンC', en: 'Vitamin C', beauty: true, role: '皮膚や粘膜の健康維持を助けるとともに、抗酸化作用を持つ栄養素です。' },
  vitD: { ja: 'ビタミンD', en: 'Vitamin D', beauty: false, role: '腸管でのカルシウムの吸収を促進し、骨の形成を助ける栄養素です。' },
  vitE: { ja: 'ビタミンE', en: 'Vitamin E', beauty: true, role: '抗酸化作用により、体内の脂質を酸化から守り、細胞の健康維持を助ける栄養素です。' },
  iron: { ja: '鉄', en: 'Iron', beauty: false, role: '赤血球を作るのに必要な栄養素です。月経のある世代の女性で不足しやすいとされています。' },
  zinc: { ja: '亜鉛', en: 'Zinc', beauty: true, role: '味覚を正常に保つのに必要で、皮膚や粘膜の健康維持を助ける栄養素です。' },
  calcium: { ja: 'カルシウム', en: 'Calcium', beauty: false, role: '骨や歯の形成に必要な栄養素です。' },
  magnesium: { ja: 'マグネシウム', en: 'Magnesium', beauty: false, role: '骨や歯の形成に必要で、多くの体内酵素の正常な働きとエネルギー産生を助ける栄養素です。' },
  potassium: { ja: 'カリウム', en: 'Potassium', beauty: false, role: '正常な血圧を保つのに必要な栄養素です。' },
  fiber: { ja: '食物繊維', en: 'Dietary fiber', beauty: false, role: '多くの人で不足しがちとされ、食事摂取基準で目標量が定められている成分です。' },
  n3: { ja: 'n-3系脂肪酸', en: 'Omega-3', beauty: true, role: '皮膚の健康維持を助ける栄養素です。青魚などに多く含まれます。' },
};

export const NUTRITION_NOTE =
  '栄養素の一般的な働きの説明であり、この料理を食べることで美容上の効果が得られることを示すものではありません。体調や持病、アレルギーのある方は医師の指示を優先してください。';
