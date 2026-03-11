
import { FormSchema } from '../types';

export const DEFAULT_FORM_SCHEMA: FormSchema = [
  {
    "id": "fs_1",
    "legend": "Customer Excel Format",
    "fields": [
      {
        "id": "f_1",
        "name": "データID",
        "label": "1. データID",
        "englishLabel": "A. Filename / Data ID *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_2",
        "name": "ソース区分",
        "label": "2. ソース区分",
        "englishLabel": "B. Source Category *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_3",
        "name": "掲載日",
        "label": "3. 掲載日",
        "englishLabel": "C. Publication Date *AI",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_4",
        "name": "掲載ページ",
        "label": "4. 掲載ページ",
        "englishLabel": "D. Page Number *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_5",
        "name": "漢字商号/氏名",
        "label": "5. 漢字商号/氏名",
        "englishLabel": "E. Company/Person Name (Kanji) *AI",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_6",
        "name": "内容要約欄",
        "label": "6. 内容要約欄",
        "englishLabel": "F. Announcement Title/Summary *AI",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_7",
        "name": "記事（全角）",
        "label": "7. 記事（全角）",
        "englishLabel": "G. Full Text (Full-width) *AI",
        "type": "textarea",
        "rows": 6,
        "width": "full"
      },
      {
        "id": "f_8",
        "name": "記事（半角）",
        "label": "8. 記事（半角）※NULL",
        "englishLabel": "H. Full Text (Half-width)※NULL",
        "type": "textarea",
        "rows": 4,
        "width": "full"
      },
      {
        "id": "f_9",
        "name": "企業CD",
        "label": "9. 企業CD ※NULL",
        "englishLabel": "I. Company Code ※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_10",
        "name": "支店コード",
        "label": "10. 支店コード ※NULL",
        "englishLabel": "J. Branch Code ※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_11",
        "name": "データ区分（公告区分）",
        "label": "11. データ区分（公告区分）",
        "englishLabel": "K. Announcement Category Code *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_12",
        "name": "実行予定日",
        "label": "12. 実行予定日",
        "englishLabel": "L. Scheduled Execution Date *AI",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_13",
        "name": "DBメンテ部署",
        "label": "13. DBメンテ部署 ※NULL",
        "englishLabel": "M. DB Maintenance Dept.※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_14",
        "name": "確認取材（フラグ）",
        "label": "14. 確認取材（フラグ）※NULL",
        "englishLabel": "N. Verification Flag ※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_15",
        "name": "確認取材日",
        "label": "15. 確認取材日 ※NULL",
        "englishLabel": "O. Verification Date ※NULL",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_16",
        "name": "DBメンテ（フラグ）",
        "label": "16. DBメンテ（フラグ）※NULL",
        "englishLabel": "P. DB Maintenance Flag ※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_17",
        "name": "DBメンテ日付",
        "label": "17. DBメンテ日付 ※NULL",
        "englishLabel": "Q. DB Maintenance Date ※NULL",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_18",
        "name": "コメント欄",
        "label": "18. コメント欄 ※NULL",
        "englishLabel": "R. Comments / Notes ※NULL",
        "type": "textarea",
        "rows": 2,
        "width": "full"
      },
      {
        "id": "f_19",
        "name": "データ追加日（登録日）",
        "label": "19. データ追加日（登録日）※NULL",
        "englishLabel": "S. Registration Date ※NULL",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_20",
        "name": "法人格区分",
        "label": "20. 法人格区分",
        "englishLabel": "T. Legal Entity Type",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_21",
        "name": "法人格位置",
        "label": "21. 法人格位置",
        "englishLabel": "U. Entity Type Position",
        "type": "select",
        "options": [
          {
            "value": "1",
            "label": "1 (前)"
          },
          {
            "value": "2",
            "label": "2 (後)"
          }
        ],
        "width": "half"
      },
      {
        "id": "f_22",
        "name": "官報種別（本紙or号外）",
        "label": "22. 官報種別（本紙or号外）",
        "englishLabel": "V. Gazette Type (Main/Extra)",
        "type": "select",
        "options": [
          {
            "value": "H",
            "label": "H"
          },
          {
            "value": "G",
            "label": "G"
          }
        ],
        "width": "half"
      },
      {
        "id": "f_23",
        "name": "官報号数",
        "label": "23. 官報号数",
        "englishLabel": "W. Gazette Issue Number",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_24",
        "name": "生年月日",
        "label": "24. 生年月日",
        "englishLabel": "X. Date of Birth",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_25",
        "name": "代表者名（スペース有）",
        "label": "25. 代表者名（スペース有）",
        "englishLabel": "Y. Representative (Spaced)",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_26",
        "name": "代表者名（スペース詰）",
        "label": "26. 代表者名（スペース詰）",
        "englishLabel": "Z. Representative (No Space)",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_27",
        "name": "所在地",
        "label": "27. 所在地",
        "englishLabel": "AA. Address *AI",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_28",
        "name": "本籍",
        "label": "28. 本籍",
        "englishLabel": "AB. Registered Domicile",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_29",
        "name": "事件種別",
        "label": "29. 事件種別 ※NULL",
        "englishLabel": "AC. Case Type ※NULL",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_30",
        "name": "事件日",
        "label": "30. 事件日 ※NULL",
        "englishLabel": "AD. Incident/Case Date ※NULL",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      },
      {
        "id": "f_31",
        "name": "事件番号",
        "label": "31. 事件番号",
        "englishLabel": "AE. Case Number *AI",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_32",
        "name": "破産管財人（スペース有）",
        "label": "32. 破産管財人（スペース有）",
        "englishLabel": "AF. Trustee (Spaced) *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_33",
        "name": "破産管財人（スペース詰）",
        "label": "33. 破産管財人（スペース詰）",
        "englishLabel": "AG. Trustee (No Space) *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_34",
        "name": "代表清算人（スペース有）",
        "label": "34. 代表清算人（スペース有）",
        "englishLabel": "AH. Rep. Liquidator (Spaced) ",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_35",
        "name": "代表清算人（スペース詰）",
        "label": "35. 代表清算人（スペース詰）",
        "englishLabel": "AI. Rep. Liquidator (No Space) ",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_36",
        "name": "裁判所名",
        "label": "36. 裁判所名",
        "englishLabel": "AJ. Court Name *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_37",
        "name": "支部名",
        "label": "37. 支部名",
        "englishLabel": "AK. Branch Court Name *AI",
        "type": "text",
        "width": "half"
      },
      {
        "id": "f_38",
        "name": "破産手続開始事件番号",
        "label": "38. 破産手続開始事件番号",
        "englishLabel": "AL. Bankruptcy Start Case No.",
        "type": "text",
        "width": "full"
      },
      {
        "id": "f_39",
        "name": "作業用確認コメント",
        "label": "39. 作業用確認コメント",
        "englishLabel": "AM. Internal Check Comment",
        "type": "textarea",
        "rows": 2,
        "width": "full"
      },
      {
        "id": "f_40",
        "name": "法人個人識別フラグ",
        "label": "40. 法人個人識別フラグ",
        "englishLabel": "AN. Entity Flag (Corp/Indiv)",
        "type": "select",
        "options": [
          {
            "value": "1",
            "label": "1 (法人)"
          },
          {
            "value": "0",
            "label": "0 (個人)"
          }
        ],
        "width": "half"
      },
      {
        "id": "f_41",
        "name": "納品日",
        "label": "41. 納品日",
        "englishLabel": "AO. Delivery Date",
        "type": "text",
        "placeholder": "yyyymmdd",
        "width": "half"
      }
    ]
  }
];
