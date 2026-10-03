"""Interpretable surface features for the required non-neural baseline."""

from __future__ import annotations

import re
from collections.abc import Sequence


_WORD_RE = re.compile(r"\b\w+\b", flags=re.UNICODE)
_SENTENCE_END_RE = re.compile(r"[.!?]+")


def text_style_features(text: str) -> list[float]:
    """Extract language-agnostic writing signals without correcting learner text.

    These values are intentionally simple and auditable. They create a stronger
    baseline than word counts alone, but they are not presented to learners as
    explanations of proficiency without later teacher validation.
    """

    words = _WORD_RE.findall(text)
    word_count = len(words)
    characters = len(text)
    sentences = max(len(_SENTENCE_END_RE.findall(text)), 1)
    unique_ratio = len({word.casefold() for word in words}) / max(word_count, 1)
    long_word_ratio = sum(len(word) >= 7 for word in words) / max(word_count, 1)
    uppercase_ratio = sum(character.isupper() for character in text) / max(characters, 1)
    digit_ratio = sum(character.isdigit() for character in text) / max(characters, 1)
    punctuation_ratio = sum(not character.isalnum() and not character.isspace() for character in text) / max(characters, 1)
    return [
        float(characters),
        float(word_count),
        word_count / sentences,
        characters / max(word_count, 1),
        unique_ratio,
        long_word_ratio,
        uppercase_ratio,
        digit_ratio,
        punctuation_ratio,
    ]


class TextStyleTransformer:
    """Scikit-learn-compatible transformer kept importable without scikit-learn."""

    def fit(self, texts: Sequence[str], y: object = None) -> "TextStyleTransformer":
        """Stateless fit method required by the estimator contract."""

        return self

    def transform(self, texts: Sequence[str]) -> object:
        """Create a sparse matrix only when the baseline dependencies are installed."""

        try:
            from scipy.sparse import csr_matrix  # type: ignore[import-not-found]
        except ImportError as error:
            raise RuntimeError("Install the 'baseline' extra before training") from error
        return csr_matrix([text_style_features(text) for text in texts], dtype=float)

    def get_params(self, deep: bool = True) -> dict[str, object]:
        """Expose an empty parameter map for cloning inside FeatureUnion."""

        return {}

    def set_params(self, **params: object) -> "TextStyleTransformer":
        """Reject unknown parameters rather than silently changing feature behavior."""

        if params:
            raise ValueError(f"TextStyleTransformer has no configurable parameters: {sorted(params)}")
        return self

