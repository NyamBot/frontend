# NyamBot 프론트엔드 브랜치 전략

## 브랜치 역할

- `main`: 배포 및 최종 안정 브랜치입니다.
- `dev`: 다음 배포를 준비하는 통합 브랜치입니다.
- `feat-<숫자>`: 기능 작업 브랜치입니다. 예시는 `feat-001`, `feat-002`입니다.

## 새 작업 브랜치 생성

새 기능 브랜치는 항상 최신 `dev`에서 생성합니다.

```powershell
git switch dev
git pull --rebase origin dev
git switch -c feat-001
```

기능 번호는 사용 가능한 다음 번호를 사용합니다. 프론트엔드와 백엔드를 같은 작업에서 함께 수정하면 두 저장소의 기능 브랜치 번호를 동일하게 맞춥니다.

## dev 병합 전 준비

기능 브랜치를 `dev`에 병합하기 전에 최신 `dev` 기준으로 rebase합니다.

```powershell
git switch dev
git pull --rebase origin dev
git switch feat-001
git rebase dev
```

이미 원격에 올린 브랜치를 rebase했다면 아래 명령으로 원격 브랜치를 갱신합니다.

```powershell
git push --force-with-lease origin feat-001
```

## feat -> dev 병합 규칙

기능 브랜치는 `dev` 기준으로 rebase한 뒤 `--no-ff` merge로 `dev`에 병합합니다.

```powershell
git switch dev
git pull --rebase origin dev
git switch feat-001
git rebase dev
git switch dev
git merge --no-ff feat-001 -m "feat: 작업 내용을 dev에 병합"
git push origin dev
```

이 방식은 Git 그래프에서 기능 브랜치의 흐름을 볼 수 있게 해주고, 문제가 생겼을 때 merge commit을 revert해서 롤백하기 쉽게 만듭니다.

`feat` 브랜치를 `dev`에 합칠 때 fast-forward merge는 사용하지 않습니다. fast-forward merge는 기능 단위 경계를 `dev` 브랜치 안에 납작하게 펼쳐서 롤백 단위를 흐리게 만들 수 있습니다.

## dev -> main 배포 병합 규칙

`dev` 검증이 끝나면 `main`으로 배포합니다.

병합 전에는 `dev` 브랜치에서 `git rebase main`을 실행합니다. 즉, `dev` 커밋 내역을 최신 `main` 위로 다시 올립니다.

```powershell
git switch main
git pull --rebase origin main
git switch dev
git pull --rebase origin dev
git rebase main
```

그 다음 `main`에서 squash merge로 하나의 커밋만 남깁니다.

```powershell
git switch main
git merge --squash dev
git commit -m "chore: dev 변경사항을 main에 반영"
git push origin main
```

`dev -> main` squash 커밋 메시지에는 배포 날짜와 스쿼시 대상 커밋 내역을 본문에 적습니다.

예시:

```text
chore: 26.06.07 커밋 내역 스쿼시

feat: 위치 기반 맛집 추천과 지도 기능 추가
chore: use dev env mode
chore: remove env example files
```

## 커밋 메시지 규칙

커밋 메시지는 한국어로 작성하고, 변경 내용을 한 줄로 간단히 적습니다.

형식:

```text
type: 변경 내용
```

사용 가능한 타입:

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드, 리팩토링 테스트 코드 추가
- `chore`: 빌드 업무 수정, 패키지 매니저 수정

예시:

```text
feat: 맛집 검색 API를 추가
fix: 로그인 토큰 만료 오류를 수정
docs: 브랜치 전략 문서를 추가
refactor: 사용자 인증 로직을 분리
chore: 프론트엔드 패키지 버전을 정리
```
