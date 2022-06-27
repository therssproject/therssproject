default_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2ODc0MjYzOTMsImlhdCI6MTY1NTg5MDM5MywidXNlciI6eyJpZCI6eyIkb2lkIjoiNjJiMDNiOWQwOTk1YmQ1MTE1ZDEzMjFiIn0sIm5hbWUiOiJDaHJpc3RpYW4iLCJlbWFpbCI6ImdpbGxjaHJpc3RpYW5nQGdtYWlsLmNvbSJ9fQ.T9NyXeUj6scwIAFGzHQUGQUNQIgUZ07Wgy-WuYrb0Jc"
default_app="62b03b9d0995bd5115d1321c"

app="${RSS_APP:=$default_app}"
token="${RSS_TOKEN:=$default_token}"

curl -v "http://localhost:8080/applications/$app/endpoints" \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  --data "{\"title\": \"$1\", \"url\": \"$2\"}"
