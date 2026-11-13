// 料理の一覧(差し替え可能なローカルデータ)。
// 1行 = 「料理名|ジャンル|主な食材(ingredients.ts のキー)|性質」
// 性質は NEUTRAL 池袋の独自ルールで決めた料理の印象:
//   F 火 = 温かい・焼く・香辛料 / E 地 = 穀物・根菜・煮込み・発酵 / A 風 = 生・葉・ハーブ・柑橘 / W 水 = 汁物・蒸す・魚介・乳
// 料理を足すときは、この表に1行加えるだけでよい。

import type { Element } from './zodiac';

const RAW = `
鮭の西京焼き|和食|salmon|F
鮭とほうれん草のクリーム煮|洋食|salmon,spinach,milk|W
鮭ときのこのホイル焼き|和食|salmon,mushroom|F
鮭の南蛮漬け|和食|salmon,carrot,bellpepper|A
サーモンのカルパッチョ|イタリアン|salmon,citrus|A
サーモンとアボカドのポケボウル|エスニック|salmon,avocado,brownrice|A
鮭の石狩鍋|和食|salmon,cabbage,tofu|W
鮭とブロッコリーのグラタン|洋食|salmon,broccoli,cheese|F
鮭の焼きおにぎり茶漬け|和食|salmon,seaweed|W
サーモンのムニエル レモンバター|フレンチ|salmon,citrus|F
さばの味噌煮|和食|mackerel,ginger|E
さばの塩焼き 大根おろし添え|和食|mackerel,daikon|F
しめさばと柑橘のマリネ|和食|mackerel,citrus|A
さばのトマト煮|イタリアン|mackerel,tomato|E
さば缶と豆苗の炒めもの|和食|mackerel,peas|F
さばの竜田揚げ|和食|mackerel,ginger|F
さばとごぼうの炊き込みご飯|和食|mackerel,burdock|E
いわしの梅煮|和食|sardine,ginger|E
いわしのつみれ汁|和食|sardine,daikon,ginger|W
いわしのハーブパン粉焼き|イタリアン|sardine,tomato|F
オイルサーディンのブルスケッタ|イタリアン|sardine,tomato|A
いわしの蒲焼き丼|和食|sardine,sesame|F
さんまの塩焼き|和食|saury,daikon|F
さんまの炊き込みご飯|和食|saury,ginger|E
ぶりの照り焼き|和食|yellowtail,ginger|F
ぶり大根|和食|yellowtail,daikon|E
ぶりしゃぶ|和食|yellowtail,shungiku|W
ぶりのカルパッチョ 柚子胡椒|和食|yellowtail,citrus|A
まぐろとアボカドの丼|和食|tuna,avocado,seaweed|A
まぐろの漬け丼|和食|tuna,sesame,seaweed|A
まぐろのタルタル|フレンチ|tuna,avocado|A
まぐろのレアステーキ 黒胡椒|洋食|tuna|F
まぐろと山芋の小鉢|和食|tuna,okra|A
かつおのたたき|和食|bonito,ginger|A
かつおの角煮|和食|bonito,ginger|E
かつおのガーリックステーキ|洋食|bonito|F
たらのちり鍋|和食|cod,tofu,shungiku|W
たらと野菜の蒸しもの|中華|cod,cabbage,ginger|W
たらのアクアパッツァ|イタリアン|cod,clam,tomato|W
鯛のアクアパッツァ|イタリアン|seabream,clam,tomato|W
鯛めし|和食|seabream,ginger|E
鯛のカルパッチョ|イタリアン|seabream,citrus|A
鯛のお吸いもの|和食|seabream|W
鯛の昆布締め|和食|seabream|A
うな重|和食|eel|F
うざく|和食|eel|A
ひつまぶし|和食|eel,seaweed|W
えびとブロッコリーの炒めもの|中華|shrimp,broccoli|F
えびチリ|中華|shrimp,tomato,ginger|F
えびとアボカドのサラダ|サラダ|shrimp,avocado|A
ガーリックシュリンプ|エスニック|shrimp|F
えびのビスク|フレンチ|shrimp,tomato,milk|W
トムヤムクン|エスニック|shrimp,mushroom,tomato|W
生春巻き|エスニック|shrimp,peas,carrot|A
えびと卵の炒めもの|中華|shrimp,egg|F
ほたてのバター醤油焼き|和食|scallop|F
ほたてのカルパッチョ 柑橘ソース|イタリアン|scallop,citrus|A
ほたてと青菜のクリーム煮|中華|scallop,komatsuna,milk|W
ほたて貝柱の炊き込みご飯|和食|scallop,ginger|E
牡蠣フライ|洋食|oyster,cabbage|F
牡蠣の土手鍋|和食|oyster,tofu|W
牡蠣のオイル漬け|洋食|oyster|E
牡蠣とほうれん草のグラタン|洋食|oyster,spinach,cheese|F
牡蠣ごはん|和食|oyster,ginger|E
あさりの酒蒸し|和食|clam|W
あさりのボンゴレビアンコ|イタリアン|clam|W
クラムチャウダー|洋食|clam,potato,milk|W
あさりと春キャベツの蒸し煮|洋食|clam,cabbage|W
あさりの味噌汁|和食|clam|W
深川めし|和食|clam,ginger|E
いかと里芋の煮もの|和食|squid,potato|E
いかのマリネ|イタリアン|squid,citrus,paprika|A
いか墨のリゾット|イタリアン|squid|E
たこのカルパッチョ|イタリアン|octopus,citrus|A
たこ飯|和食|octopus,ginger|E
たことじゃがいものガリシア風|スペイン|octopus,potato,paprika|F
いくら丼|和食|salmonroe,seaweed|W
海鮮ちらし|和食|tuna,salmon,salmonroe|A
ブイヤベース|フレンチ|cod,shrimp,clam,tomato|W
パエリア|スペイン|shrimp,clam,paprika|F
シーフードのフォー|エスニック|shrimp,squid,peas|W
蒸し鶏のねぎソース|中華|chicken,ginger|W
よだれ鶏|中華|chicken,sesame|F
鶏むね肉のハーブグリル|洋食|chicken,tomato|F
鶏ハム|洋食|chicken|A
棒棒鶏|中華|chicken,sesame,cabbage|A
鶏むね肉のレモン南蛮|和食|chicken,citrus|A
鶏とブロッコリーの塩炒め|中華|chicken,broccoli|F
鶏ささみと梅のサラダ|サラダ|chicken,cabbage|A
参鶏湯|韓国|chickenthigh,ginger,brownrice|W
鶏の水炊き|和食|chickenthigh,cabbage,tofu|W
筑前煮|和食|chickenthigh,lotus,burdock,carrot|E
鶏の照り焼き|和食|chickenthigh|F
チキンカレー|エスニック|chickenthigh,tomato|F
タンドリーチキン|エスニック|chickenthigh,yogurt|F
グリーンカレー|エスニック|chickenthigh,eggplant|F
ガパオライス|エスニック|chickenthigh,bellpepper,egg|F
鶏肉のトマト煮|イタリアン|chickenthigh,tomato,mushroom|E
チキン南蛮|和食|chickenthigh,egg|F
鶏の唐揚げ レモン添え|和食|chickenthigh,citrus|F
親子丼|和食|chickenthigh,egg|E
鶏つくねの鍋|和食|chicken,cabbage,shiitake|W
鶏と根菜のポトフ|フレンチ|chickenthigh,carrot,potato,cabbage|W
チキンのクリームシチュー|洋食|chickenthigh,carrot,milk|W
カオマンガイ|エスニック|chickenthigh,ginger|E
鶏ときのこの炊き込みご飯|和食|chickenthigh,mushroom|E
鶏レバーのコンフィ|フレンチ|liver|E
鶏レバーの甘辛煮|和食|liver,ginger|E
レバーペーストのタルティーヌ|フレンチ|liver|A
レバにら炒め|中華|liver,nira|F
豚の生姜焼き|和食|pork,ginger,cabbage|F
豚しゃぶサラダ|サラダ|pork,cabbage,tomato|A
豚汁|和食|pork,burdock,carrot,daikon|W
豚ヒレのソテー りんごソース|フレンチ|pork,apple|F
豚ヒレカツ|洋食|pork,cabbage|F
豚肉と小松菜の炒めもの|中華|pork,komatsuna|F
ゴーヤチャンプルー|和食|pork,tofu,egg|F
回鍋肉|中華|pork,cabbage,bellpepper|F
豚の角煮|中華|pork,egg,ginger|E
豚と白菜のミルフィーユ鍋|和食|pork,cabbage|W
豚キムチ|韓国|pork|F
豚肉のアスパラ巻き|洋食|pork,asparagus|F
ポークビーンズ|洋食|pork,chickpea,tomato|E
酢豚|中華|pork,paprika,carrot|F
肉じゃが|和食|beef,potato,carrot|E
ローストビーフ|洋食|beef|F
牛赤身のステーキ|洋食|beef|F
ビーフシチュー|洋食|beef,carrot,potato|E
牛肉とブロッコリーのオイスター炒め|中華|beef,broccoli|F
チンジャオロース|中華|beef,bellpepper|F
プルコギ|韓国|beef,carrot|F
ビビンバ|韓国|beef,spinach,carrot,egg|E
ユッケジャンスープ|韓国|beef,nira,egg|F
牛すじと大根の煮込み|和食|beef,daikon|E
ボルシチ|ロシア|beef,beet,cabbage|W
牛肉のフォー|エスニック|beef,peas,ginger|W
ハッシュドビーフ|洋食|beef,mushroom|E
ボロネーゼ|イタリアン|beef,tomato,carrot|E
ラザニア|イタリアン|beef,tomato,cheese|F
ラムチョップのハーブ焼き|フレンチ|lamb|F
ラムとひよこ豆のクスクス|エスニック|lamb,chickpea,carrot|E
ジンギスカン|和食|lamb,cabbage,bellpepper|F
羊肉のクミン炒め|中華|lamb|F
だし巻き卵|和食|egg|E
茶碗蒸し|和食|egg,shrimp,shiitake|W
スパニッシュオムレツ|スペイン|egg,potato,paprika|F
エッグベネディクト|洋食|egg|F
シャクシュカ|エスニック|egg,tomato,paprika|F
ニラ玉|中華|egg,nira|F
かに玉|中華|egg,shiitake|F
キッシュ ほうれん草とベーコン|フレンチ|egg,spinach,cheese|F
半熟卵のポテトサラダ|サラダ|egg,potato|A
天津飯|中華|egg|W
オムライス|洋食|egg,tomato,chicken|F
温玉のせサラダうどん|和食|egg,cabbage|A
麻婆豆腐|中華|tofu,ginger|F
揚げ出し豆腐|和食|tofu,daikon|W
湯豆腐|和食|tofu|W
冷奴 薬味たっぷり|和食|tofu,ginger|A
豆腐ハンバーグ|和食|tofu,chicken,shiitake|F
白和え|和食|tofu,spinach,sesame|A
厚揚げと小松菜の煮びたし|和食|atsuage,komatsuna|W
厚揚げの生姜焼き|和食|atsuage,ginger|F
純豆腐チゲ|韓国|tofu,clam,egg|F
豆乳鍋|和食|soymilk,cabbage,chicken|W
豆乳担々麺|中華|soymilk,sesame|F
豆乳のポタージュ|スープ|soymilk,pumpkin|W
納豆ごはん 卵黄のせ|和食|natto,egg|E
納豆オムレツ|和食|natto,egg|F
納豆と海藻の和えもの|和食|natto,wakame|A
ひきわり納豆の手巻き|和食|natto,seaweed|A
レンズ豆のスープ|スープ|lentil,carrot,tomato|W
レンズ豆のサラダ|サラダ|lentil,tomato,paprika|A
レンズ豆のダール|エスニック|lentil,tomato,ginger|F
フムス|エスニック|chickpea,sesame|E
ファラフェル|エスニック|chickpea|F
ひよこ豆とほうれん草のカレー|エスニック|chickpea,spinach,tomato|F
ミネストローネ|イタリアン|chickpea,tomato,carrot,cabbage|W
枝豆の冷製ポタージュ|スープ|edamame,milk|W
枝豆ごはん|和食|edamame|E
ずんだ白玉|甘味|edamame|E
かぼちゃの煮もの|和食|pumpkin|E
かぼちゃのポタージュ|スープ|pumpkin,milk|W
かぼちゃのグラタン|洋食|pumpkin,cheese|F
かぼちゃとレーズンのサラダ|サラダ|pumpkin,yogurt|A
ほうとう|和食|pumpkin,carrot,mushroom|E
にんじんのラペ|フレンチ|carrot,citrus|A
にんじんのポタージュ|スープ|carrot,milk|W
にんじんしりしり|和食|carrot,egg|F
キャロットケーキ|甘味|carrot,walnut|E
きんぴらごぼう|和食|burdock,carrot,sesame|E
ごぼうのポタージュ|スープ|burdock,milk|W
れんこんのはさみ焼き|和食|lotus,chicken|F
れんこんのきんぴら|和食|lotus,sesame|E
れんこんのすり流し|和食|lotus|W
ガスパチョ|スペイン|tomato,paprika,bellpepper|A
トマトのファルシ|フレンチ|tomato,beef|F
カプレーゼ|イタリアン|tomato,cheese|A
トマトと卵の炒めもの|中華|tomato,egg|F
冷やしトマトのだし浸し|和食|tomato|A
トマトリゾット|イタリアン|tomato,cheese|E
ラタトゥイユ|フレンチ|paprika,eggplant,tomato|E
パプリカのマリネ|イタリアン|paprika|A
パプリカの肉詰め|洋食|paprika,beef|F
ブロッコリーのペペロンチーノ|イタリアン|broccoli|F
ブロッコリーとえびのサラダ|サラダ|broccoli,shrimp,egg|A
ブロッコリーのポタージュ|スープ|broccoli,milk|W
ほうれん草のおひたし|和食|spinach|A
ほうれん草のごま和え|和食|spinach,sesame|A
ほうれん草のポタージュ|スープ|spinach,milk|W
ほうれん草と卵のココット|フレンチ|spinach,egg|F
小松菜と油揚げの煮びたし|和食|komatsuna,atsuage|W
小松菜のナムル|韓国|komatsuna,sesame|A
小松菜とバナナのスムージー|飲みもの|komatsuna,banana|A
ケールのシーザーサラダ|サラダ|kale,cheese,egg|A
ケールのスムージー|飲みもの|kale,apple,kiwi|A
春菊とくるみのサラダ|サラダ|shungiku,walnut|A
春菊の白和え|和食|shungiku,tofu|A
モロヘイヤのスープ|スープ|moroheiya,egg|W
モロヘイヤのおひたし|和食|moroheiya|A
アスパラガスのグリル 温泉卵添え|フレンチ|asparagus,egg|F
アスパラガスのリゾット|イタリアン|asparagus,cheese|E
オクラと長芋の梅和え|和食|okra|A
オクラの肉巻き|和食|okra,pork|F
ロールキャベツ|洋食|cabbage,beef,tomato|W
コールスロー|サラダ|cabbage,carrot|A
ザワークラウトとソーセージ|洋食|cabbage,pork|E
紫キャベツのマリネ|サラダ|redcabbage,citrus|A
ビーツのポタージュ|スープ|beet,milk|W
ビーツとオレンジのサラダ|サラダ|beet,citrus|A
アボカドのタルタル|フレンチ|avocado,tomato|A
ワカモレとトルティーヤ|エスニック|avocado,tomato|A
アボカドトースト 半熟卵|朝ごはん|avocado,egg|A
アボカドとまぐろのわさび和え|和食|avocado,tuna|A
さつまいもの甘煮|和食|sweetpotato,citrus|E
さつまいもご飯|和食|sweetpotato,sesame|E
大学いも|甘味|sweetpotato,sesame|F
スイートポテト|甘味|sweetpotato,milk|E
さつまいものポタージュ|スープ|sweetpotato,milk|W
じゃがいものガレット|フレンチ|potato,cheese|F
ヴィシソワーズ|フレンチ|potato,milk|W
ジャーマンポテト|洋食|potato,pork|F
ニョッキのトマトソース|イタリアン|potato,tomato|E
きのこのアヒージョ|スペイン|mushroom,shrimp|F
きのこの炊き込みご飯|和食|mushroom,carrot|E
きのこのクリームパスタ|イタリアン|mushroom,milk|W
きのこのマリネ|洋食|mushroom,citrus|A
きのこのポタージュ|スープ|mushroom,milk|W
椎茸の肉詰め|和食|shiitake,chicken|F
なすの揚げびたし|和食|eggplant,ginger|W
なすの田楽|和食|eggplant,sesame|F
麻婆なす|中華|eggplant,beef|F
なすとトマトのチーズ焼き|イタリアン|eggplant,tomato,cheese|F
ピーマンの肉詰め|洋食|bellpepper,beef|F
焼きピーマンのおかか和え|和食|bellpepper|A
ふろふき大根|和食|daikon,sesame|E
大根と豚のスープ|中華|daikon,pork,ginger|W
おでん|和食|daikon,egg,atsuage|W
豆苗と卵のスープ|中華|peas,egg|W
豆苗のナムル|韓国|peas,sesame|A
にら饅頭|中華|nira,pork|F
チャプチェ|韓国|beef,spinach,carrot,shiitake|F
ひじきの煮もの|和食|hijiki,carrot,atsuage|E
ひじきと豆のサラダ|サラダ|hijiki,edamame,chickpea|A
ひじきの混ぜごはん|和食|hijiki,brownrice|E
わかめスープ|韓国|wakame,sesame|W
わかめと胡瓜の酢のもの|和食|wakame|A
わかめと豆腐の味噌汁|和食|wakame,tofu|W
海苔の佃煮と玄米ごはん|和食|seaweed,brownrice|E
玄米のおにぎり 鮭と海苔|和食|brownrice,salmon,seaweed|E
玄米の雑穀リゾット|イタリアン|brownrice,mushroom,cheese|E
十穀米と焼き魚の定食|和食|brownrice,mackerel|E
玄米のビビンバ|韓国|brownrice,spinach,egg|E
もち麦のサラダ|サラダ|barley,tomato,edamame|A
もち麦入り参鶏湯風スープ|スープ|barley,chicken,ginger|W
キヌアのタブレ|エスニック|quinoa,tomato,citrus|A
キヌアとアボカドのボウル|サラダ|quinoa,avocado,shrimp|A
オートミールのポリッジ|朝ごはん|oats,milk,banana|W
オーバーナイトオーツ ベリー添え|朝ごはん|oats,yogurt,berry|A
オートミールの和風雑炊|和食|oats,egg,wakame|W
グラノーラとヨーグルト|朝ごはん|oats,yogurt,almond|A
天ぷらそば|和食|soba,shrimp|W
とろろそば|和食|soba,okra|A
鴨南蛮そば|和食|soba,chicken|W
冷やしたぬきそば|和食|soba,wakame|A
そば粉のガレット|フレンチ|soba,egg,cheese|F
鍋焼きうどん|和食|egg,shrimp,shiitake|W
冷やし中華|中華|egg,tomato,chicken|A
フォー・ガー|エスニック|chicken,peas,citrus|W
担々麺|中華|beef,sesame,komatsuna|F
ちゃんぽん|中華|shrimp,squid,cabbage|W
ペスカトーレ|イタリアン|shrimp,clam,squid,tomato|W
ジェノベーゼ|イタリアン|broccoli,almond,cheese|A
カルボナーラ|イタリアン|egg,cheese|F
アマトリチャーナ|イタリアン|tomato,pork|F
プッタネスカ|イタリアン|tomato,sardine|F
ペペロンチーノ 菜の花|イタリアン|komatsuna|F
ちらし寿司|和食|egg,shrimp,shiitake|A
手巻き寿司|和食|tuna,salmon,seaweed,egg|A
押し寿司 さば|和食|mackerel,ginger|A
海鮮丼|和食|tuna,salmon,shrimp|A
鉄火丼|和食|tuna,seaweed|A
牛丼 温玉のせ|和食|beef,egg|E
カツ丼|和食|pork,egg|F
天丼|和食|shrimp,pumpkin,eggplant|F
炊き込みご飯 五目|和食|chicken,carrot,burdock,shiitake|E
雑炊 卵と三つ葉|和食|egg|W
お粥 鶏と生姜|中華|chicken,ginger|W
中華粥 ほたて|中華|scallop,ginger|W
石焼きビビンバ|韓国|beef,spinach,carrot,egg|F
キンパ|韓国|spinach,carrot,egg,seaweed|A
サムゲタン風スープ|韓国|chicken,ginger|W
タッカルビ|韓国|chickenthigh,cabbage,sweetpotato|F
ナシゴレン|エスニック|shrimp,egg|F
ミーゴレン|エスニック|shrimp,cabbage|F
バインミー|エスニック|pork,carrot,daikon|A
ルーロー飯|中華|pork,egg|E
ビリヤニ|エスニック|chickenthigh,yogurt|F
バターチキンカレー|エスニック|chickenthigh,tomato,milk|F
キーマカレー|エスニック|beef,tomato,eggplant|F
サグカレー|エスニック|spinach,chicken|F
スープカレー|エスニック|chickenthigh,pumpkin,eggplant|F
ポトフ|フレンチ|pork,carrot,cabbage,potato|W
ブッフ・ブルギニョン|フレンチ|beef,mushroom,carrot|E
コック・オー・ヴァン|フレンチ|chickenthigh,mushroom|E
カスレ|フレンチ|pork,chickpea|E
ニース風サラダ|サラダ|tuna,egg,tomato|A
コブサラダ|サラダ|chicken,avocado,egg,tomato|A
シーザーサラダ|サラダ|chicken,cheese,egg|A
グリークサラダ|サラダ|tomato,cheese|A
シーフードサラダ|サラダ|shrimp,squid,citrus|A
ミモザサラダ|サラダ|egg,cabbage|A
温野菜のバーニャカウダ|イタリアン|broccoli,carrot,paprika|F
ミネストラ・ディ・ファッロ|イタリアン|barley,tomato,carrot|W
ミルクスープ 鮭と白菜|スープ|salmon,cabbage,milk|W
酸辣湯|中華|tofu,egg,shiitake|F
コーンポタージュ|スープ|milk|W
オニオングラタンスープ|フレンチ|cheese|F
すまし汁 はまぐり|和食|clam|W
粕汁|和食|salmon,daikon,carrot|W
けんちん汁|和食|tofu,burdock,carrot,daikon|W
ギリシャヨーグルト はちみつとくるみ|朝ごはん|yogurt,walnut|A
フレンチトースト ベリー添え|朝ごはん|egg,milk,berry|F
パンケーキ バナナとヨーグルト|朝ごはん|egg,banana,yogurt|F
アサイーボウル|朝ごはん|berry,banana,oats|A
キウイとヨーグルトのボウル|朝ごはん|kiwi,yogurt|A
スクランブルエッグとほうれん草のトースト|朝ごはん|egg,spinach|F
和朝食 焼き鮭と味噌汁|和食|salmon,tofu,wakame|E
いちごのパンナコッタ|甘味|strawberry,milk|W
いちご大福|甘味|strawberry|E
柑橘のゼリー|甘味|citrus|W
グレープフルーツのサラダ|サラダ|grapefruit,shrimp|A
柿と春菊の白和え|和食|persimmon,shungiku,tofu|A
柿のマリネ チーズ添え|イタリアン|persimmon,cheese|A
マンゴーラッシー|飲みもの|mango,yogurt|A
マンゴープリン|甘味|mango,milk|W
いちじくとチーズのタルティーヌ|フレンチ|fig,cheese|A
いちじくのコンポート|甘味|fig|W
プルーンとくるみのヨーグルト|朝ごはん|prune,walnut,yogurt|A
桃のコンポート|甘味|peach|W
桃とモッツァレラのサラダ|サラダ|peach,cheese|A
ぶどうとくるみのサラダ|サラダ|grape,walnut|A
梨のコンポート|甘味|pear|W
焼きりんご シナモン|甘味|apple|F
アップルパイ|甘味|apple|F
りんごとさつまいものきんとん|甘味|apple,sweetpotato|E
ベリーのクラフティ|甘味|berry,egg,milk|F
バナナとくるみのマフィン|甘味|banana,walnut,egg|E
黒ごまプリン|甘味|sesame,milk|W
豆乳プリン|甘味|soymilk|W
抹茶と豆乳のラテ|飲みもの|soymilk|W
ホットチャイ 豆乳|飲みもの|soymilk,ginger|F
生姜とはちみつのホットドリンク|飲みもの|ginger,citrus|F
アーモンドミルクのスムージー|飲みもの|almond,banana,berry|A
いちごミルク|飲みもの|strawberry,milk|W
トマトジュースとオリーブのカクテル風|飲みもの|tomato|A
ホットココア 豆乳仕立て|飲みもの|soymilk|F
焼き芋|甘味|sweetpotato|F
かぼちゃのプリン|甘味|pumpkin,egg,milk|W
`;

export interface Food {
  id: number;
  name: string;
  genre: string;
  ing: string[];
  element: Element;
}

const EL: Record<string, Element> = { F: 'fire', E: 'earth', A: 'air', W: 'water' };

export const FOODS: Food[] = RAW.trim()
  .split('\n')
  .map((line, i) => {
    const [name, genre, ing, el] = line.split('|');
    return { id: i, name, genre, ing: ing.split(','), element: EL[el.trim()] };
  });
