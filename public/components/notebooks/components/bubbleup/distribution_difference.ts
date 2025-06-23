/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { firstValueFrom, getFlattenedObject } from '@osd/std';
import { NotebookContext } from 'common/types/notebooks';
import {
  DataPublicPluginStart,
  ISearchStart,
  OPENSEARCH_FIELD_TYPES,
} from '../../../../../../../src/plugins/data/public';
import { getData, getSearch } from '../../../../services';

class BubbleUpDataDistributionService {
  private readonly search: ISearchStart;
  private readonly data: DataPublicPluginStart;

  constructor() {
    this.data = getData();
    this.search = getSearch();
  }

  private async fetchIndexData(
    timeField: string,
    dataSourceId: string | undefined,
    index: string,
    startTime: Date,
    endTime: Date,
    size: number = 1000,
    filter?: Array<Record<string, any>>
  ): Promise<Array<Record<string, any>>> {
    this.data.query.queryString.setQuery({ language: 'kuery' }, true);
    const params = {
      index,
      body: {
        query: {
          bool: {
            filter: [
              {
                range: {
                  [timeField]: {
                    // @timestamp
                    gte: startTime.toISOString(),
                    lte: endTime.toISOString(),
                    format: 'strict_date_optional_time',
                  },
                },
              },
              ...(filter || []),
            ],
          },
        },
        size,
      },
    };

    try {
      const response = await firstValueFrom(
        this.search.search(
          {
            dataSourceId,
            params,
          },
          {}
        )
      );
      return response.rawResponse.hits.hits.map((hit) => hit._source);
    } catch (error) {
      console.error('Error fetching index data:', error);
      throw error;
    }
  }

  private async getFields(
    index: string,
    dataSourceId?: string
  ): Promise<Array<{ name: string; type: string; esTypes: string[] }>> {
    return this.data.indexPatterns.getFieldsForWildcard({
      pattern: index,
      dataSourceId,
    });
  }

  public async fetchComparisonData(props: {
    timeField: string;
    dataSourceId?: string | undefined;
    index: string;
    selectionStartTime: Date;
    selectionEndTime: Date;
    selectionFilters?: NotebookContext['filters'];
    size?: number;
  }): Promise<{
    selection: Array<Record<string, any>>;
    baseline: Array<Record<string, any>>;
  }> {
    const {
      timeField,
      dataSourceId,
      index,
      selectionStartTime,
      selectionEndTime,
      size = 1000,
      selectionFilters,
    } = props;
    const selectionDurationMs = selectionEndTime.getTime() - selectionStartTime.getTime();
    const baselineEndTime = new Date(selectionStartTime.getTime());
    const baselineStartTime = new Date(baselineEndTime.getTime() - selectionDurationMs * 5);

    const [selectionData, baselineData] = await Promise.all([
      this.fetchIndexData(
        timeField,
        dataSourceId,
        index,
        selectionStartTime,
        selectionEndTime,
        size,
        selectionFilters
      ),
      this.fetchIndexData(timeField, dataSourceId, index, baselineStartTime, baselineEndTime, size),
    ]);

    return {
      selection: selectionData,
      baseline: baselineData,
    };
  }

  //     /**
  //    * @param data
  //    * @param maxCardinality Maximum cardinality (number of different values) threshold
  //    * @returns Field list
  //    */
  //     public discoverFields(
  //         data: any,
  //         maxCardinality: number = 50,
  //     ): string[] {
  //         // Get all possible fields in the data
  //         const allFields = new Set<string>();
  //         const combineData = Object.values(data).flat();
  //         const fieldCounts: Record<string, Set<any>> = {};

  //         // Recursive function to extract field paths
  //         const extractFields = (obj: any, path: string = '') => {
  //             if (!obj || typeof obj !== 'object') return;

  //             Object.entries(obj).forEach(([key, value]) => {
  //                 const currentPath = path ? `${path}.${key}` : key;

  //                 // console.log('type', typeof(value));
  //                 // if(typeof(value) === 'number' || Array.isArray(value)) return;
  //                 if (Array.isArray(value)) return;

  //                 // if(typeof(value) === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return;

  //                 // If this is a leaf node (not an object or array), add it to the field list
  //                 if (value === null || value === undefined ||
  //                     typeof value !== 'object' ||
  //                     (Array.isArray(value) && (typeof value[0] !== 'object' || value[0] === null))) {
  //                     allFields.add(currentPath);

  //                     // Track the cardinality of each field (number of different values)
  //                     if (!fieldCounts[currentPath]) {
  //                         fieldCounts[currentPath] = new Set();
  //                     }
  //                     fieldCounts[currentPath].add(JSON.stringify(value));
  //                 } else {
  //                     extractFields(value, currentPath);
  //                 }
  //             });
  //         };

  //         // Extract fields for each document
  //         combineData.forEach(hit => {
  //             extractFields(hit);
  //         });

  //         const usefulFields = Array.from(allFields).filter(field => {
  //             // Exclude fields with excessively high cardinality (such as UUID, random ID, etc.)
  //             const cardinality = fieldCounts[field]?.size || 0;
  //             return cardinality <= maxCardinality && cardinality > 1;
  //         });

  //         console.log('fieldCounts', fieldCounts);

  //         return usefulFields;
  //     }

  public async discoverFields(
    data: {
      selection: Array<Record<string, any>>;
      baseline: Array<Record<string, any>>;
    },
    index: string,
    dataSourceId?: string
  ): Promise<string[]> {
    const combineData = Object.values(data).flat();
    const fieldValueSets: Record<string, Set<any>> = {};
    const maxCardinality = Math.max(5, Math.floor(combineData.length / 4));

    const mappings = await this.getFields(index, dataSourceId);

    const keywordFields = mappings
      .filter((field) => {
        return (
          field.esTypes && field.esTypes.includes(OPENSEARCH_FIELD_TYPES.KEYWORD) && field.name
        );
      })
      .map((field) => field.name);

    const normalizedFields = keywordFields.map((keywordField) => {
      return keywordField.endsWith('.keyword')
        ? keywordField.replace('.keyword', '')
        : keywordField;
    });

    normalizedFields.forEach((field) => {
      fieldValueSets[field] = new Set();
    });

    combineData.forEach((doc) => {
      normalizedFields.forEach((field) => {
        const value = getFlattenedObject(doc)?.[field];
        if (value !== null && value !== undefined) {
          fieldValueSets[field].add(JSON.stringify(value));
        }
      });
    });

    const usefulFields = normalizedFields.filter((field) => {
      const cardinality = fieldValueSets[field]?.size || 0;
      if (/id$/i.test(field)) {
        return cardinality <= 30 && cardinality > 0;
      }
      return cardinality <= maxCardinality && cardinality > 0;
    });

    console.log('usefulFields', usefulFields);

    return usefulFields;
  }

  /**
   * @param data
   * @param field
   */
  public calculateFieldDistribution(data: any, field: string): Record<string, number> {
    const distribution: Record<string, number> = {};
    data.forEach((hit: any) => {
      // const value = this.getNestedValue(hit, field);
      const value = getFlattenedObject(hit)[field];

      if (value !== undefined && value !== null) {
        const strValue = String(value);
        distribution[strValue] = (distribution[strValue] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * Group numerical keys and merge counts
   * @param selectionDist {key: count}
   * @param baselineDist {key: count}
   * @param numGroups The default number of groups to create is 5
   * @returns Objects containing the distribution of grouped selection groups and benchmark groups
   */
  public groupNumericKeys(
    selectionDist: Record<string, number>,
    baselineDist: Record<string, number>,
    numGroups: number = 5
  ): {
    groupedSelectionDist: Record<string, number>;
    groupedBaselineDist: Record<string, number>;
  } {
    // Merge all keys and convert them to numerical values
    const allKeys = new Set([...Object.keys(selectionDist), ...Object.keys(baselineDist)]);

    if (allKeys.size > 30 && Array.from(allKeys).every((key) => !isNaN(Number(key)))) {
      const numericKeys = Array.from(allKeys)
        .filter((key) => !isNaN(Number(key)))
        .map((key) => Number(key));

      const min = Math.min(...numericKeys);
      const max = Math.max(...numericKeys);
      const range = max - min;
      const groupSize = range / numGroups;

      const groupedSelectionDist: Record<string, number> = {};
      const groupedBaselineDist: Record<string, number> = {};

      // Create groups and merge values
      for (let i = 0; i < numGroups; i++) {
        const lowerBound = min + i * groupSize;
        const upperBound = i === numGroups - 1 ? max : min + (i + 1) * groupSize;

        // Create group labels (e.g. "1-10")
        const groupLabel = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;

        groupedSelectionDist[groupLabel] = 0;
        groupedBaselineDist[groupLabel] = 0;

        // Merge the counts of the original keys into the corresponding groups
        numericKeys.forEach((numKey) => {
          // The last group includes the upper boundary
          const belongs =
            i === numGroups - 1
              ? numKey >= lowerBound && numKey <= upperBound
              : numKey >= lowerBound && numKey < upperBound;

          if (belongs) {
            const strKey = String(numKey);
            if (strKey in selectionDist) {
              groupedSelectionDist[groupLabel] += selectionDist[strKey];
            }
            if (strKey in baselineDist) {
              groupedBaselineDist[groupLabel] += baselineDist[strKey];
            }
          }
        });
      }

      return {
        groupedSelectionDist,
        groupedBaselineDist,
      };
    }

    return {
      groupedSelectionDist: selectionDist,
      groupedBaselineDist: baselineDist,
    };
  }

  /**
   * @param obj
   * @param path（such "server.name"）
   */
  private getNestedValue(obj: any, path: string): any {
    if (obj == null || path == null) return undefined;

    if (Object.prototype.hasOwnProperty.call(obj, path) || !path.includes('.')) {
      return obj[path];
    }

    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : undefined;
    }, obj);
  }

  /**
   * Calculate the JS Divergence between baseline and selection
   * @param dist1
   * @param dist2
   */
  public calculateJSDivergence(
    dist1: Record<string, number>,
    dist2: Record<string, number>
  ): number {
    // Merge all unique fields
    const allKeys = [...new Set([...Object.keys(dist1), ...Object.keys(dist2)])];

    // Calculate the total count
    const total1 = Object.values(dist1).reduce((sum, count) => sum + count, 0) || 1;
    const total2 = Object.values(dist2).reduce((sum, count) => sum + count, 0) || 1;

    // Transfer count to probability
    const prob1: Record<string, number> = {};
    const prob2: Record<string, number> = {};
    allKeys.forEach((key) => {
      prob1[key] = (dist1[key] || 0) / total1;
      prob2[key] = (dist2[key] || 0) / total2;
    });

    // Calculate JS Divergence
    let jsd = 0;
    allKeys.forEach((key) => {
      const p = prob1[key];
      const q = prob2[key];
      const m = (p + q) / 2;

      // Avoid log(0)
      if (p > 0) {
        jsd += (p / 2) * Math.log2(p / m);
      }
      if (q > 0) {
        jsd += (q / 2) * Math.log2(q / m);
      }
    });

    return jsd;
  }

  public calculateMaxDifference(
    selectionDist: Record<string, number>,
    baselineDist: Record<string, number>
  ): number {
    // Merge all unique fields
    const allKeys = [...new Set([...Object.keys(selectionDist), ...Object.keys(baselineDist)])];

    // Calculate the total count
    const total1 = Object.values(selectionDist).reduce((sum, count) => sum + count, 0) || 1;
    const total2 = Object.values(baselineDist).reduce((sum, count) => sum + count, 0) || 1;

    // Transfer count to probability
    const selectionDistProb: Record<string, number> = {};
    const baselineDistProb: Record<string, number> = {};
    allKeys.forEach((key) => {
      selectionDistProb[key] = (selectionDist[key] || 0) / total1;
      baselineDistProb[key] = (baselineDist[key] || 0) / total2;
    });

    // Calculate JS Divergence
    let maxDifference = -Infinity;
    allKeys.forEach((key) => {
      const diff = selectionDistProb[key] - baselineDistProb[key];
      maxDifference = maxDifference > diff ? maxDifference : diff;
    });

    return maxDifference;
  }

  /**
   * @param comparisonData
   * @param fieldsToAnalyze
   */
  public analyzeDifferences(
    comparisonData: { selection: any; baseline: any },
    fieldsToAnalyze: string[]
  ): Array<{
    field: string;
    divergence: number;
    selectionDist: Record<string, number>;
    baselineDist: Record<string, number>;
  }> {
    const results = [];

    for (const field of fieldsToAnalyze) {
      // Calculate the distribution of baseline and selection
      const selectionDist = this.calculateFieldDistribution(comparisonData.selection, field);
      const baselineDist = this.calculateFieldDistribution(comparisonData.baseline, field);
      const { groupedSelectionDist, groupedBaselineDist } = this.groupNumericKeys(
        selectionDist,
        baselineDist
      );
      const divergence = this.calculateMaxDifference(groupedSelectionDist, groupedBaselineDist);

      // if (divergence > 0) {
      results.push({
        field,
        divergence,
        selectionDist: groupedSelectionDist,
        baselineDist: groupedBaselineDist,
      });
      // }
    }

    // Sort in descending order by divergence
    return results.sort((a, b) => b.divergence - a.divergence);
  }

  public formatComparisonSummary(
    differences: Array<{
      field: string;
      divergence: number;
      selectionDist: Record<string, number>;
      baselineDist: Record<string, number>;
    }>,
    maxResults: number = 30
  ): Array<{
    field: string;
    divergence: number;
    topChanges: Array<{
      value: string;
    }>;
  }> {
    // Only take the first N significant differences
    const topDifferences = differences.slice(0, maxResults);
    console.log('topDifferences', topDifferences);

    return topDifferences.map((diff) => {
      const { field, divergence, selectionDist, baselineDist } = diff;

      // Calculate the changes in all fields
      const allKeys = [...new Set([...Object.keys(selectionDist), ...Object.keys(baselineDist)])];
      const selectionTotal =
        Object.values(selectionDist).reduce((sum, count) => sum + count, 0) || 1;
      const baselineTotal = Object.values(baselineDist).reduce((sum, count) => sum + count, 0) || 1;

      const changes = allKeys.map((value) => {
        const selectionCount = selectionDist[value] || 0;
        const baselineCount = baselineDist[value] || 0;

        const selectionPercentage = selectionCount / selectionTotal;
        const baselinePercentage = baselineCount / baselineTotal;

        let changePercentage = 0;
        if (baselinePercentage > 0 && selectionPercentage > 0) {
          changePercentage =
            ((selectionPercentage - baselinePercentage) / baselinePercentage) * 100;
        } else {
          changePercentage = Infinity; // From zero to non-zero is infinite variation
        }

        return {
          value,
          selectionPercentage: Number(selectionPercentage.toFixed(2)),
          baselinePercentage: Number(baselinePercentage.toFixed(2)),
          changePercentage,
        };
      });

      // Sort by percentage change (absolute value)
      const sortedChanges = changes.sort((a, b) => {
        return b.baselinePercentage - a.baselinePercentage;
        // return Math.abs(b.changePercentage) - Math.abs(a.changePercentage)
      });

      // Take the top 30 largest changes
      const topChanges = sortedChanges.slice(0, 30);

      return {
        field,
        divergence,
        topChanges,
      };
    });
  }
}

export const bubbleUpDataDistributionService = new BubbleUpDataDistributionService();
