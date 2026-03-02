#!/bin/bash
SLUG="lp_1772389521159_wli78e"
curl -s "https://superplacestudy.pages.dev/api/debug/check-db-schema" | \
  jq -r ".landing_pages_sample[] | select(.slug == \"$SLUG\") | 
  {
    id, 
    slug, 
    title, 
    template_type, 
    hasHtml: (.html_content != null), 
    htmlLength: (.html_content | length // 0)
  }"
