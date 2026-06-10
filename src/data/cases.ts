import type { AudiologyCase, Ear, PatientBehavior, ThresholdByFrequency } from "../domain/types";

const normalBehavior: PatientBehavior = {
  cooperation: 0.96,
  falsePositiveRate: 0.015,
  falseNegativeRate: 0.025,
  responseDelayMs: [360, 880],
  fatigueAfterEvents: 65,
  tinnitusFrequencies: [],
  instructionSensitivity: 0.92
};

const cautiousBehavior: PatientBehavior = {
  cooperation: 0.88,
  falsePositiveRate: 0.025,
  falseNegativeRate: 0.055,
  responseDelayMs: [520, 1300],
  fatigueAfterEvents: 48,
  tinnitusFrequencies: [],
  instructionSensitivity: 0.82
};

const unreliableBehavior: PatientBehavior = {
  cooperation: 0.72,
  falsePositiveRate: 0.09,
  falseNegativeRate: 0.12,
  responseDelayMs: [650, 1900],
  fatigueAfterEvents: 36,
  tinnitusFrequencies: [1000, 2000, 4000],
  instructionSensitivity: 0.62
};

const earPair = (right: ThresholdByFrequency, left: ThresholdByFrequency): Record<Ear, ThresholdByFrequency> => ({
  right,
  left
});

export const CASES: AudiologyCase[] = [
  {
    id: "C01",
    title: "双耳听阈基本正常",
    difficulty: "basic",
    visibleProfile: {
      age: 20,
      sex: "女",
      chiefComplaint: "体检前练习病例，无明显听力下降主诉。",
      history: ["无耳痛耳流脓", "无明显噪声暴露", "偶尔使用耳机听音乐"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，反应清楚。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 10, 250: 5, 500: 10, 1000: 10, 2000: 5, 3000: 10, 4000: 10, 6000: 15, 8000: 15 },
        { 125: 10, 250: 10, 500: 10, 1000: 5, 2000: 10, 3000: 10, 4000: 10, 6000: 15, 8000: 15 }
      ),
      bone: earPair(
        { 250: 5, 500: 10, 1000: 5, 2000: 5, 4000: 10 },
        { 250: 10, 500: 5, 1000: 5, 2000: 10, 4000: 10 }
      )
    },
    behavior: normalBehavior,
    teachingTags: ["basicFlow", "normalAudiogram"],
    answer: {
      summary: "双耳听阈基本在正常范围，气骨导无有意义差异。",
      expectedPattern: "正常或接近正常听力图。",
      keyPoints: ["从 1000 Hz 熟悉化开始", "完成双耳常规气导", "可练习 1000 Hz 复测"],
      requiredMasking: []
    }
  },
  {
    id: "C02",
    title: "双耳轻度感音神经性听损",
    difficulty: "basic",
    visibleProfile: {
      age: 34,
      sex: "男",
      chiefComplaint: "近一年觉得会议中听不清远处发言。",
      history: ["无耳流脓史", "无明显单侧差异", "父亲中年后听力下降"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，接近阈值时稍犹豫。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 20, 250: 25, 500: 30, 1000: 35, 2000: 35, 3000: 35, 4000: 40, 6000: 40, 8000: 45 },
        { 125: 20, 250: 25, 500: 30, 1000: 30, 2000: 35, 3000: 40, 4000: 40, 6000: 45, 8000: 45 }
      ),
      bone: earPair(
        { 250: 25, 500: 30, 1000: 35, 2000: 35, 4000: 40 },
        { 250: 25, 500: 30, 1000: 30, 2000: 35, 4000: 40 }
      )
    },
    behavior: cautiousBehavior,
    teachingTags: ["sensorineural", "degree"],
    answer: {
      summary: "双耳轻度为主的感音神经性听力损失模式。",
      expectedPattern: "气导和骨导同步升高，气骨导差不明显。",
      keyPoints: ["区分程度和性质", "关注三频 PTA", "接近阈值需要重复确认"],
      requiredMasking: []
    }
  },
  {
    id: "C03",
    title: "高频下降老年性听力图",
    difficulty: "basic",
    visibleProfile: {
      age: 68,
      sex: "女",
      chiefComplaint: "家人说电视声音开得很大，听年轻人说话费力。",
      history: ["症状缓慢进展", "双耳接近", "无近期中耳炎"],
      otoscopy: {
        right: "外耳道少量耵聍，不影响观察，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，反应速度较慢。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 20, 250: 25, 500: 25, 1000: 30, 2000: 40, 3000: 55, 4000: 60, 6000: 70, 8000: 75 },
        { 125: 20, 250: 25, 500: 30, 1000: 35, 2000: 45, 3000: 55, 4000: 65, 6000: 70, 8000: 75 }
      ),
      bone: earPair(
        { 250: 25, 500: 25, 1000: 30, 2000: 40, 4000: 60 },
        { 250: 25, 500: 30, 1000: 35, 2000: 45, 4000: 65 }
      )
    },
    behavior: {
      ...cautiousBehavior,
      responseDelayMs: [700, 1600],
      fatigueAfterEvents: 42
    },
    teachingTags: ["highFrequencySlope", "pta"],
    answer: {
      summary: "双耳以高频下降为主的感音神经性听力损失模式。",
      expectedPattern: "低频较好，高频逐步下降。",
      keyPoints: ["不要只看 PTA，需描述构型", "高频反应慢时避免误判", "报告应注明可靠性"],
      requiredMasking: []
    }
  },
  {
    id: "C04",
    title: "噪声性听力损失切迹",
    difficulty: "intermediate",
    visibleProfile: {
      age: 29,
      sex: "男",
      chiefComplaint: "射击训练后耳鸣，平时沟通大多可以。",
      history: ["职业噪声和冲击噪声暴露", "双耳高调耳鸣", "无耳流脓"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，4000 Hz 附近受耳鸣干扰。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 10, 250: 10, 500: 15, 1000: 15, 2000: 20, 3000: 35, 4000: 55, 6000: 40, 8000: 25 },
        { 125: 10, 250: 10, 500: 15, 1000: 15, 2000: 20, 3000: 40, 4000: 60, 6000: 45, 8000: 30 }
      ),
      bone: earPair(
        { 250: 10, 500: 15, 1000: 15, 2000: 20, 4000: 55 },
        { 250: 10, 500: 15, 1000: 15, 2000: 20, 4000: 60 }
      )
    },
    behavior: {
      ...cautiousBehavior,
      tinnitusFrequencies: [3000, 4000, 6000]
    },
    teachingTags: ["noiseNotch", "tinnitus"],
    answer: {
      summary: "双耳 4000 Hz 附近切迹，符合噪声性听力损失教学模式。",
      expectedPattern: "3000-6000 Hz 区域下降，8000 Hz 部分回升。",
      keyPoints: ["补测 3000 和 6000 Hz", "耳鸣频率附近需要复核", "报告要描述切迹而不只写平均听阈"],
      requiredMasking: []
    }
  },
  {
    id: "C05",
    title: "左耳轻度传导性听损",
    difficulty: "intermediate",
    visibleProfile: {
      age: 22,
      sex: "女",
      chiefComplaint: "左耳闷堵 2 周，听别人说话像隔了一层。",
      history: ["近期感冒后出现", "无强噪声暴露", "无眩晕"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "鼓膜轻度内陷，外耳道通畅。"
      },
      demeanor: "配合，左耳低频反应较差。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 10, 250: 10, 500: 10, 1000: 10, 2000: 10, 3000: 10, 4000: 15, 6000: 15, 8000: 15 },
        { 125: 45, 250: 40, 500: 35, 1000: 35, 2000: 30, 3000: 30, 4000: 30, 6000: 35, 8000: 35 }
      ),
      bone: earPair(
        { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 15 },
        { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 15 }
      )
    },
    behavior: normalBehavior,
    teachingTags: ["conductive", "airBoneGap", "maskingDecision"],
    answer: {
      summary: "左耳轻度传导性听力损失模式，右耳听阈基本正常。",
      expectedPattern: "左耳气导升高，骨导接近正常，存在气骨导差。",
      keyPoints: ["左耳骨导需要考虑非测试耳", "气骨导差是报告重点", "左耳气导高强度时注意交叉听觉风险"],
      requiredMasking: [
        { ear: "left", route: "bone", frequencyHz: 500, reason: "左耳气骨导差明显，骨导需耳特异性确认。" },
        { ear: "left", route: "bone", frequencyHz: 1000, reason: "左耳气骨导差明显，骨导需耳特异性确认。" }
      ]
    }
  },
  {
    id: "C06",
    title: "右耳混合性听损",
    difficulty: "advanced",
    visibleProfile: {
      age: 47,
      sex: "男",
      chiefComplaint: "右耳多年听力下降，近期沟通更费力。",
      history: ["幼年中耳炎史", "右耳偶有闷胀", "无近期强噪声暴露"],
      otoscopy: {
        right: "鼓膜局部瘢痕样改变。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，右耳接近阈值时反应慢。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 55, 250: 55, 500: 60, 1000: 60, 2000: 65, 3000: 70, 4000: 75, 6000: 80, 8000: 85 },
        { 125: 15, 250: 15, 500: 20, 1000: 20, 2000: 20, 3000: 25, 4000: 25, 6000: 30, 8000: 30 }
      ),
      bone: earPair(
        { 250: 30, 500: 35, 1000: 35, 2000: 40, 4000: 50 },
        { 250: 15, 500: 20, 1000: 20, 2000: 20, 4000: 25 }
      )
    },
    behavior: cautiousBehavior,
    teachingTags: ["mixed", "masking", "asymmetry"],
    answer: {
      summary: "右耳混合性听力损失模式，左耳轻度高频受累。",
      expectedPattern: "右耳气导和骨导均升高，同时存在气骨导差。",
      keyPoints: ["右耳气导和骨导均需考虑掩蔽", "避免把交叉听觉结果记为右耳真实阈值", "报告应同时描述骨导异常和气骨导差"],
      requiredMasking: [
        { ear: "right", route: "air", frequencyHz: 1000, reason: "双耳气导差较大，右耳气导高强度存在交叉听觉风险。" },
        { ear: "right", route: "air", frequencyHz: 2000, reason: "双耳气导差较大，右耳气导高强度存在交叉听觉风险。" },
        { ear: "right", route: "bone", frequencyHz: 1000, reason: "骨导非耳特异性，右耳需掩蔽确认。" },
        { ear: "right", route: "bone", frequencyHz: 2000, reason: "骨导非耳特异性，右耳需掩蔽确认。" }
      ]
    }
  },
  {
    id: "C07",
    title: "左耳重度不对称听损",
    difficulty: "advanced",
    visibleProfile: {
      age: 41,
      sex: "女",
      chiefComplaint: "左耳多年几乎听不清，右耳日常沟通尚可。",
      history: ["左耳突发听力下降病史", "无活动性中耳炎", "右耳偶感疲劳"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，但左耳高强度刺激时紧张。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 15, 250: 15, 500: 20, 1000: 20, 2000: 25, 3000: 25, 4000: 30, 6000: 35, 8000: 40 },
        { 125: 75, 250: 80, 500: 85, 1000: 90, 2000: 95, 3000: 100, 4000: 105, 6000: 110, 8000: 110 }
      ),
      bone: earPair(
        { 250: 15, 500: 20, 1000: 20, 2000: 25, 4000: 30 },
        { 250: 75, 500: 80, 1000: 85, 2000: 90, 4000: 95 }
      ),
      uncomfortableLevel: earPair(
        { 250: 100, 500: 100, 1000: 100, 2000: 100, 4000: 100 },
        { 250: 110, 500: 110, 1000: 110, 2000: 110, 4000: 110 }
      )
    },
    behavior: {
      ...cautiousBehavior,
      falseNegativeRate: 0.07,
      fatigueAfterEvents: 40
    },
    teachingTags: ["asymmetry", "crossHearing", "masking"],
    answer: {
      summary: "左耳重度至极重度感音神经性听力损失模式，右耳轻度高频受累。",
      expectedPattern: "左耳远差于右耳，未掩蔽气导容易出现交叉听觉。",
      keyPoints: ["左耳气导必须识别交叉听觉风险", "高强度给声要控制次数", "无反应或输出上限需规范标记"],
      requiredMasking: [
        { ear: "left", route: "air", frequencyHz: 500, reason: "左耳阈值远高于右耳，未掩蔽可能由右耳听到。" },
        { ear: "left", route: "air", frequencyHz: 1000, reason: "左耳阈值远高于右耳，未掩蔽可能由右耳听到。" },
        { ear: "left", route: "air", frequencyHz: 2000, reason: "左耳阈值远高于右耳，未掩蔽可能由右耳听到。" },
        { ear: "left", route: "bone", frequencyHz: 1000, reason: "骨导非耳特异性，左耳需掩蔽确认。" }
      ]
    }
  },
  {
    id: "C08",
    title: "骨导掩蔽训练病例",
    difficulty: "advanced",
    visibleProfile: {
      age: 18,
      sex: "男",
      chiefComplaint: "右耳闷堵，老师说需要重点练骨导掩蔽。",
      history: ["右耳近期鼻炎后闷胀", "无耳鸣", "左耳自觉正常"],
      otoscopy: {
        right: "鼓膜内陷，活动度提示减弱。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，容易被掩蔽噪声分散注意。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 55, 250: 50, 500: 45, 1000: 40, 2000: 35, 3000: 35, 4000: 35, 6000: 40, 8000: 40 },
        { 125: 10, 250: 10, 500: 10, 1000: 10, 2000: 10, 3000: 15, 4000: 15, 6000: 20, 8000: 20 }
      ),
      bone: earPair(
        { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 15 },
        { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 15 }
      )
    },
    behavior: {
      ...normalBehavior,
      cooperation: 0.91,
      falseNegativeRate: 0.04
    },
    teachingTags: ["boneMasking", "conductive"],
    answer: {
      summary: "右耳传导性听力损失模式，骨导结果需要掩蔽确认。",
      expectedPattern: "右耳低中频气导升高，骨导接近正常。",
      keyPoints: ["骨导默认非耳特异性", "右耳骨导平台判断是本病例重点", "掩蔽噪声过大可能影响测试耳"],
      requiredMasking: [
        { ear: "right", route: "bone", frequencyHz: 500, reason: "右耳存在明显气骨导差。" },
        { ear: "right", route: "bone", frequencyHz: 1000, reason: "右耳存在明显气骨导差。" },
        { ear: "right", route: "bone", frequencyHz: 2000, reason: "右耳存在明显气骨导差。" }
      ]
    }
  },
  {
    id: "C09",
    title: "耳鸣干扰的高频听损",
    difficulty: "intermediate",
    visibleProfile: {
      age: 52,
      sex: "女",
      chiefComplaint: "双耳蝉鸣样耳鸣，安静环境更明显。",
      history: ["耳鸣持续半年", "无耳流脓", "睡眠较差"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，但常询问声音是否已经开始。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 15, 250: 15, 500: 20, 1000: 25, 2000: 35, 3000: 45, 4000: 55, 6000: 60, 8000: 65 },
        { 125: 15, 250: 20, 500: 20, 1000: 25, 2000: 35, 3000: 45, 4000: 55, 6000: 60, 8000: 65 }
      ),
      bone: earPair(
        { 250: 15, 500: 20, 1000: 25, 2000: 35, 4000: 55 },
        { 250: 20, 500: 20, 1000: 25, 2000: 35, 4000: 55 }
      )
    },
    behavior: {
      ...cautiousBehavior,
      falsePositiveRate: 0.055,
      tinnitusFrequencies: [3000, 4000, 6000, 8000]
    },
    teachingTags: ["tinnitus", "reliability"],
    answer: {
      summary: "双耳高频下降感音神经性听力损失模式，耳鸣影响高频可靠性。",
      expectedPattern: "双耳对称，高频下降。",
      keyPoints: ["耳鸣频率附近需复测确认", "记录可靠性和患者主诉", "避免把假阳性当阈值"],
      requiredMasking: []
    }
  },
  {
    id: "C10",
    title: "反应不稳定患者",
    difficulty: "intermediate",
    visibleProfile: {
      age: 25,
      sex: "男",
      chiefComplaint: "自觉听力忽好忽坏，测试时有些紧张。",
      history: ["无明确耳病史", "近期考试压力大", "自述常漏按反应键"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "紧张，容易提前按键，也会漏按。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 15, 250: 15, 500: 15, 1000: 15, 2000: 20, 3000: 20, 4000: 20, 6000: 25, 8000: 25 },
        { 125: 15, 250: 15, 500: 15, 1000: 15, 2000: 20, 3000: 20, 4000: 25, 6000: 25, 8000: 30 }
      ),
      bone: earPair(
        { 250: 15, 500: 15, 1000: 15, 2000: 20, 4000: 20 },
        { 250: 15, 500: 15, 1000: 15, 2000: 20, 4000: 25 }
      )
    },
    behavior: unreliableBehavior,
    teachingTags: ["unreliable", "reinstruction"],
    answer: {
      summary: "真实听阈接近正常，但患者反应不稳定，需要重新指导和复测。",
      expectedPattern: "若流程规范，双耳应接近正常；错误流程会出现散乱阈值。",
      keyPoints: ["假阳性和假阴性都要识别", "1000 Hz 复测非常重要", "报告不能过度解释不可靠数据"],
      requiredMasking: []
    }
  },
  {
    id: "C11",
    title: "耳道塌陷风险病例",
    difficulty: "advanced",
    visibleProfile: {
      age: 76,
      sex: "女",
      chiefComplaint: "戴压耳式耳机时左耳像被堵住。",
      history: ["双耳听力多年下降", "左耳耳廓较软", "无近期耳痛"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道入口较窄，鼓膜可见。"
      },
      demeanor: "配合，压耳式耳机左耳低频反应异常。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 25, 250: 30, 500: 30, 1000: 35, 2000: 45, 3000: 55, 4000: 60, 6000: 65, 8000: 70 },
        { 125: 25, 250: 30, 500: 35, 1000: 40, 2000: 50, 3000: 60, 4000: 65, 6000: 70, 8000: 75 }
      ),
      bone: earPair(
        { 250: 30, 500: 30, 1000: 35, 2000: 45, 4000: 60 },
        { 250: 30, 500: 35, 1000: 40, 2000: 50, 4000: 65 }
      )
    },
    behavior: {
      ...cautiousBehavior,
      responseDelayMs: [780, 1700]
    },
    teachingTags: ["earCanalCollapse", "transducer"],
    answer: {
      summary: "双耳高频下降感音神经性听力损失模式，左耳压耳式耳机可能引入伪传导成分。",
      expectedPattern: "使用插入式耳机时气骨导较一致；压耳式耳机可能让左耳气导偏差。",
      keyPoints: ["异常气骨导差要结合换能器判断", "耳廓和耳道状态影响测试", "可改用插入式耳机复核"],
      requiredMasking: []
    }
  },
  {
    id: "C12",
    title: "左耳无反应与输出上限",
    difficulty: "advanced",
    visibleProfile: {
      age: 33,
      sex: "男",
      chiefComplaint: "左耳完全听不到，右耳可交流。",
      history: ["左耳外伤后听力严重下降", "右耳无明显不适", "无活动性耳病"],
      otoscopy: {
        right: "外耳道通畅，鼓膜完整。",
        left: "外耳道通畅，鼓膜完整。"
      },
      demeanor: "配合，左耳高强度声音无明确反应。"
    },
    hiddenAudiology: {
      air: earPair(
        { 125: 10, 250: 10, 500: 15, 1000: 15, 2000: 20, 3000: 20, 4000: 25, 6000: 25, 8000: 30 },
        { 125: 105, 250: 110, 500: 115, 1000: 120, 2000: 120, 3000: 120, 4000: 120, 6000: 120, 8000: 120 }
      ),
      bone: earPair(
        { 250: 10, 500: 15, 1000: 15, 2000: 20, 4000: 25 },
        { 250: 80, 500: 85, 1000: 90, 2000: 95, 4000: 100 }
      ),
      uncomfortableLevel: earPair(
        { 250: 100, 500: 100, 1000: 100, 2000: 100, 4000: 100 },
        { 250: 120, 500: 120, 1000: 120, 2000: 120, 4000: 120 }
      )
    },
    behavior: {
      ...normalBehavior,
      falseNegativeRate: 0.04
    },
    teachingTags: ["noResponse", "outputLimit", "crossHearing"],
    answer: {
      summary: "左耳极重度听力损失或多频率无反应教学病例，右耳基本正常。",
      expectedPattern: "左耳多频率到设备上限仍无可靠反应，需使用无反应标记并掩蔽控制。",
      keyPoints: ["不能把设备上限误写成真实阈值", "无反应用符号和备注说明", "左耳高强度气导需考虑右耳交叉听觉"],
      requiredMasking: [
        { ear: "left", route: "air", frequencyHz: 500, reason: "左耳无反应高强度刺激存在交叉听觉风险。" },
        { ear: "left", route: "air", frequencyHz: 1000, reason: "左耳无反应高强度刺激存在交叉听觉风险。" },
        { ear: "left", route: "air", frequencyHz: 2000, reason: "左耳无反应高强度刺激存在交叉听觉风险。" }
      ]
    }
  }
];

export function getCaseById(caseId: string): AudiologyCase {
  const found = CASES.find((item) => item.id === caseId);
  if (!found) {
    throw new Error(`Unknown case id: ${caseId}`);
  }
  return found;
}

