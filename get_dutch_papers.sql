-- Extract papers for SPECTER2 embedding generation
-- Source: CWTS OpenAlex 2025 August (orion-dbs.community/collections/cwts/#openalex_2025aug)
-- Output columns match the embeddings notebook input: id, title, abstract

SELECT DISTINCT
    w.work_id           AS id,
    wt.title            AS title,
    wa.abstract         AS abstract
FROM
    `cwts-leiden.openalex_2025aug.work` AS w
INNER JOIN
    `cwts-leiden.openalex_2025aug.work_affiliation_institution` AS wai ON w.work_id = wai.work_id
INNER JOIN
    `cwts-leiden.openalex_2025aug.institution` AS i ON wai.institution_id = i.institution_id
LEFT JOIN
    `cwts-leiden.openalex_2025aug.work_title` AS wt ON w.work_id = wt.work_id
LEFT JOIN
    `cwts-leiden.openalex_2025aug.work_abstract` AS wa ON w.work_id = wa.work_id
WHERE
    i.country_iso_alpha2_code = 'NL'
