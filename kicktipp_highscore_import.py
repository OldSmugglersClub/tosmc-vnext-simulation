#!/usr/bin/env python3
"""Erzeugt highscore.json aus sechs Kicktipp-CSV-Exporten. E-Mail-Spalten werden nie übernommen."""
from __future__ import annotations
import argparse,csv,json,re
from pathlib import Path

def num(v):
    try:return float(str(v or '0').replace(',','.'))
    except:return 0.0

def integer(v):return int(num(v))
def read(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f,delimiter=';'))
def clean_overall(r):return {'rank':integer(r.get('Rang')),'name':r.get('Name',''),'bonusPoints':num(r.get('Bonuspunkte')),'matchdayWins':num(r.get('Gesamtspieltagssiege')),'totalPoints':num(r.get('Gesamtpunkte'))}
def clean_matchday(r):return {'rank':integer(r.get('Rang')),'name':r.get('Name',''),'points':num(r.get('Punkte')),'bonusPoints':num(r.get('Bonuspunkte')),'matchdayWinner':integer(r.get('Spieltagssieger')),'totalPoints':num(r.get('Gesamtpunkte')),'matchdayWins':num(r.get('Gesamtspieltagssiege')),'matchdayRank':integer(r.get('Spieltagsplatzierung'))}
def sort_rows(rows,key):return sorted(rows,key=lambda x:(-x[key],x['name'].casefold()))
def main():
 p=argparse.ArgumentParser();p.add_argument('--individual-overall',required=True);p.add_argument('--individual-matchday',required=True);p.add_argument('--old-overall',required=True);p.add_argument('--new-overall',required=True);p.add_argument('--old-matchday',required=True);p.add_argument('--new-matchday',required=True);p.add_argument('--matchday',default='Smugglerauftrag Auftakt');p.add_argument('--export-date',default='30.07.2026');p.add_argument('-o','--output',default='highscore.json');a=p.parse_args()
 ind_o=sort_rows([clean_overall(x) for x in read(a.individual_overall)],'totalPoints');ind_m=sort_rows([clean_matchday(x) for x in read(a.individual_matchday)],'points')
 team_o=sort_rows([clean_overall(read(a.old_overall)[0]),clean_overall(read(a.new_overall)[0])],'totalPoints');team_m=sort_rows([clean_matchday(read(a.old_matchday)[0]),clean_matchday(read(a.new_matchday)[0])],'points')
 # ranks from export remain authoritative; order only breaks ties consistently
 lead=ind_o[0]['totalPoints']-(ind_o[1]['totalPoints'] if len(ind_o)>1 else 0);best_score=ind_m[0] if ind_m and ind_m[0]['points']>0 else None;most=max(ind_o,key=lambda x:x['matchdayWins']) if ind_o else None
 out={'meta':{'season':'2026/2027','matchday':a.matchday,'exportDate':a.export_date,'source':'Kicktipp-CSV-Export','privacy':'E-Mail-Adressen werden nicht übernommen.'},'individual':{'overall':ind_o,'matchday':ind_m},'teams':{'overall':team_o,'matchday':team_m},'records':{'highestMatchdayScore':({'name':best_score['name'],'points':best_score['points']} if best_score else None),'mostMatchdayWins':({'name':most['name'],'wins':most['matchdayWins']} if most and most['matchdayWins']>0 else None),'leadMargin':lead,'bestTeam':({'name':team_o[0]['name'],'points':team_o[0]['totalPoints']} if len(team_o)>1 and team_o[0]['totalPoints']>team_o[1]['totalPoints'] else None)}}
 Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()
