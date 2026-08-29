# Data Model

Модель даних InfoHub описує основні сутності, їх властивості та зв’язки.

## ContentUnit

**ContentUnit** - базова одиниця інформації в системі..

Кожна одиниця має:

- `id` - унікальний ідентифікатор
- `title` - назва
- `type` - тип
- `state` - стан
- `maturity` - зрілість
- `topic_id` - тема
- `purpose` - призначення
- `body` - вміст
- `relations` - зв’язки
- `metadata` - додаткові дані
- `created_at` - дата створення
- `updated_at` - дата оновлення

## Type

Визначає форму та роль інформації.

`NOTE` · `MATERIAL` · `ARTICLE` · `LESSON` · `COURSE`

## State

Визначає поточний етап роботи з інформацією.

`DRAFT` · `WORKING` · `READY` · `ARCHIVED`

## Maturity

Визначає відповідність інформації стандарту її типу.

Зрілість визначається через набір критеріїв конкретного типу та має значення від `0` до `100`.

## Topic

Визначає, про що інформація.

Topic є окремою сутністю та може мати ієрархію через `parent_id`.

Приклад:
`Web3 → DeFi → Арбітраж → MEV → Ліквідації`

АБО

`Трейдинг → Опціони → Експірація`

Один Topic може містити різні типи ContentUnit.

## Purpose

Визначає призначення інформації.

`PERSONAL` · `REFERENCE` · `LEARNING` · `PUBLISHING` · `TEACHING` · `PROJECT`

## Relations

Визначають зв’язки між ContentUnit.

`RELATED_TO` · `REFERENCES` · `DERIVED_FROM` · `PART_OF` · `USES`

## Template

Визначає структуру конкретного Type.

Кожен тип може мати власний набір полів, секцій та критеріїв.

## Criteria

Визначають стандарт якості конкретного Type та використовуються для розрахунку Maturity.

Критерій має:

- `id`
- `name`
- `required`
- `weight`

## AI Analysis

AI Analysis - аналітичний шар над ContentUnit.

Може містити:

- `potential_types` - потенційні напрямки розвитку
- `missing_criteria` - відсутні критерії
- `related_content` - пов’язаний контент
- `suggestions` - рекомендації
- `knowledge_gaps` - прогалини

AI Analysis не змінює базову модель автоматично та не визначає обов'язковий шлях розвитку.

## Модель

`ContentUnit → Type + State + Maturity + Topic + Purpose + Relations`

`Template + Criteria → Maturity`

`ContentUnit → AI Analysis → Recommendations`