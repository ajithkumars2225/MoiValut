class TransliterationService {
  static const Map<String, String> _vowelMap = {
    'aa': 'ஆ', 'a': 'அ', 'ii': 'ஈ', 'i': 'இ', 'uu': 'ஊ', 'u': 'உ',
    'ee': 'ஏ', 'e': 'எ', 'ai': 'ஐ', 'oo': 'ஓ', 'o': 'ஒ', 'au': 'ஔ'
  };

  static const Map<String, String> _consonantMap = {
    'ka': 'க', 'kha': 'க', 'ga': 'க', 'gha': 'க',
    'cha': 'ச', 'sa': 'ச', 'sha': 'ச', 's': 'ஸ',
    'ta': 'ட', 'tha': 'த', 'da': 'ட', 'dha': 'த',
    'na': 'ந', 'nna': 'ண', 'n': 'ந',
    'pa': 'ப', 'fa': 'ப', 'ba': 'ப', 'bha': 'ப',
    'ma': 'ம', 'm': 'ம',
    'ya': 'ய', 'ra': 'ர', 'rra': 'ற', 'la': 'ல', 'lla': 'ள', 'zha': 'ழ',
    'va': 'வ', 'w': 'வ', 'ha': 'ஹ', 'ja': 'ஜ'
  };

  static String transliterateWord(String text) {
    if (text.isEmpty) return text;

    // Rule: Single character or single-letter initial (e.g., "C", "M.", "K") remains in English.
    final trimmed = text.trim();
    if (trimmed.length <= 1) return text;
    if (trimmed.length == 2 && trimmed.endsWith('.')) return text;

    // Basic heuristic phonetic converter for common Tamil names/villages
    String lower = text.toLowerCase();
    
    // Quick replacements for common Tamil names / endings
    lower = lower
      .replaceAll('ramesh', 'ரமேஷ்')
      .replaceAll('suresh', 'சுரேஷ்')
      .replaceAll('rajesh', 'ராஜேஷ்')
      .replaceAll('kumar', 'குமார்')
      .replaceAll('raja', 'ராஜா')
      .replaceAll('mani', 'மணி')
      .replaceAll('selvam', 'செல்வம்')
      .replaceAll('murugan', 'முருகன்')
      .replaceAll('kannan', 'கண்ணன்')
      .replaceAll('velu', 'வேலு')
      .replaceAll('gopal', 'கோபால்')
      .replaceAll('pandi', 'பாண்டி')
      .replaceAll('lakshmi', 'லக்ஷ்மி')
      .replaceAll('devi', 'தேவி')
      .replaceAll('patti', 'பாட்டி')
      .replaceAll('annachi', 'அண்ணாச்சி')
      .replaceAll('madurai', 'மதுரை')
      .replaceAll('chennai', 'சென்னை')
      .replaceAll('trichy', 'திருச்சி')
      .replaceAll('kovil', 'கோவில்')
      .replaceAll('patti', 'பட்டி');

    // If matches custom rule, return mapped string
    if (lower != text.toLowerCase()) {
      return lower;
    }

    return text;
  }
}
