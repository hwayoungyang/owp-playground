export const remoteFilesystemScript = String.raw`
case "$(uname -s)" in
  Linux)
    device_id() { stat -c '%d' -- "$1"; }
    promote() { mv -nT -- "$1" "$2"; }
    replace_link() { mv -fT -- "$1" "$2"; }
    ;;
  Darwin)
    device_id() { stat -f '%d' "$1"; }
    promote() { mv -nh -- "$1" "$2"; }
    replace_link() { mv -fh -- "$1" "$2"; }
    ;;
  *) fail '원자적 current 전환을 지원하지 않는 OS입니다.' ;;
esac
`;
