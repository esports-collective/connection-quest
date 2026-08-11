-- Seed the 20-quest starter library. Idempotent on `code`.
insert into public.quests
  (code,title,category,style,type,difficulty,est_minutes,location,description,skills_built,capacities,xp,yn_questions)
values
('Q001','Play Your Game, Your Way','Gaming','open','Solo with support','starter',45,'Hub',
 'You pick the game. You decide how to play. A support worker joins in on your terms.',
 array['Decision-making','Gaming'], array['Self-direction','Choice-making'], 10,
 '[{"prompt":"Did you choose the game yourself?","is_capacity":false},{"prompt":"Did you play the way you wanted?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you do this again?","is_capacity":false}]'::jsonb),

('Q002','Join the Party','Gaming','open','Group','regular',45,'Hub',
 'See what the group is playing, then adapt and join in — even if it''s not your usual game.',
 array['Social play','Adaptability'], array['Flexibility','Social adaptation','Compromise'], 25,
 '[{"prompt":"Did you join a game the group was already playing?","is_capacity":false},{"prompt":"Was it different from your usual pick?","is_capacity":true},{"prompt":"Did you have fun with the group?","is_capacity":false},{"prompt":"Would you join in again?","is_capacity":false}]'::jsonb),

('Q003','Teach a Game','Gaming','structured','Group','regular',30,'Hub',
 'Show someone how to play one of your favourite games. Explain the rules and help them have a go.',
 array['Communication','Gaming'], array['Initiative','Communication','Patience'], 25,
 '[{"prompt":"Did you show someone how to play?","is_capacity":false},{"prompt":"Did you help them understand?","is_capacity":true},{"prompt":"Did you enjoy helping?","is_capacity":false},{"prompt":"Would you teach again?","is_capacity":false}]'::jsonb),

('Q004','Team Up','Gaming','open','Group','regular',60,'Hub',
 'Play a co-op or team game with others. Work together toward the same goal.',
 array['Teamwork','Gaming'], array['Social adaptation','Compromise','Communication'], 25,
 '[{"prompt":"Did you play on a team?","is_capacity":false},{"prompt":"Did you work together with them?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you team up again?","is_capacity":false}]'::jsonb),

('Q005','Ranked Climb','Gaming','structured','Solo','epic',60,'Hub',
 'Play a competitive/ranked session. Notice how you handle wins and losses.',
 array['Focus','Resilience','Gaming'], array['Self-regulation','Persistence'], 50,
 '[{"prompt":"Did you play a ranked game?","is_capacity":false},{"prompt":"Did you stay calm with wins and losses?","is_capacity":true},{"prompt":"Did you enjoy the challenge?","is_capacity":false},{"prompt":"Would you climb again?","is_capacity":false}]'::jsonb),

('Q006','Cook Lunch','Life Skills','structured','Solo with support','regular',60,'Hub kitchen',
 'Choose a simple meal; gather what you need; cook it; share or enjoy it.',
 array['Cooking','Food safety','Independence'], array['Planning','Independence','Initiative'], 25,
 '[{"prompt":"Did you make a meal?","is_capacity":false},{"prompt":"Did you do most of the cooking yourself?","is_capacity":true},{"prompt":"Did you enjoy eating it?","is_capacity":false},{"prompt":"Would you cook again?","is_capacity":false}]'::jsonb),

('Q007','Deposit Day','Life Skills','structured','Solo with support','starter',30,'Community',
 'Collect cans/bottles, take them to the deposit point, and return them for the refund.',
 array['Money handling','Community access'], array['Independence','Initiative'], 10,
 '[{"prompt":"Did you return the cans or bottles?","is_capacity":false},{"prompt":"Did you handle the deposit yourself?","is_capacity":true},{"prompt":"Did you get your refund?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q008','Smart Shopper','Life Skills','structured','Solo with support','regular',45,'Community',
 'Make a short list and a budget, shop for the items, and pay at the checkout.',
 array['Money handling','Planning','Shopping'], array['Planning','Independence','Decision-making'], 25,
 '[{"prompt":"Did you make a list or budget?","is_capacity":false},{"prompt":"Did you stick to it?","is_capacity":true},{"prompt":"Did you pay at the checkout?","is_capacity":false},{"prompt":"Would you shop again?","is_capacity":false}]'::jsonb),

('Q009','Laundry Legend','Life Skills','structured','Solo','starter',30,'Hub',
 'Sort a load, run the machine, and hang or fold the washing.',
 array['Independent living','Following steps'], array['Independence','Self-direction'], 10,
 '[{"prompt":"Did you do a load of washing?","is_capacity":false},{"prompt":"Did you do it on your own?","is_capacity":true},{"prompt":"Did you finish all the steps?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q010','Gym Visit','Community Access','structured','Solo with support','regular',60,'Community',
 'Head to the gym, do a short workout of your choice, and check in on how you feel after.',
 array['Physical activity','Community access'], array['Initiative','Independence','Self-care'], 25,
 '[{"prompt":"Did you go to the gym?","is_capacity":false},{"prompt":"Did you pick your own workout?","is_capacity":true},{"prompt":"Did you feel good after?","is_capacity":false},{"prompt":"Would you go again?","is_capacity":false}]'::jsonb),

('Q011','Library Trip','Community Access','structured','Solo with support','starter',45,'Community',
 'Visit the library, find something you like, and borrow it with a library card.',
 array['Community access','Literacy'], array['Independence','Choice-making'], 10,
 '[{"prompt":"Did you visit the library?","is_capacity":false},{"prompt":"Did you find something you liked?","is_capacity":true},{"prompt":"Did you borrow it?","is_capacity":false},{"prompt":"Would you go again?","is_capacity":false}]'::jsonb),

('Q012','Cafe Order','Community Access','structured','Solo with support','starter',30,'Community',
 'Choose something from the menu, order it, and pay at a cafe.',
 array['Communication','Money handling'], array['Confidence','Communication','Independence'], 10,
 '[{"prompt":"Did you order something?","is_capacity":false},{"prompt":"Did you order it yourself?","is_capacity":true},{"prompt":"Did you pay for it?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q013','Bus Route','Community Access','structured','Solo with support','epic',60,'Community',
 'Plan a public transport trip, catch the bus/train, and reach your stop.',
 array['Travel skills','Planning','Community access'], array['Planning','Independence','Problem-solving'], 50,
 '[{"prompt":"Did you make a travel plan?","is_capacity":false},{"prompt":"Did you follow your plan to your stop?","is_capacity":true},{"prompt":"Did you feel confident?","is_capacity":false},{"prompt":"Would you travel again?","is_capacity":false}]'::jsonb),

('Q014','Lunch with Friends','Social','open','Group','regular',60,'Community',
 'Share a meal with friends. Chat, take turns, and enjoy the company.',
 array['Social skills','Community access'], array['Social adaptation','Communication','Compromise'], 25,
 '[{"prompt":"Did you share a meal with friends?","is_capacity":false},{"prompt":"Did you chat with them?","is_capacity":true},{"prompt":"Did you enjoy the company?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q015','Board Game Meetup','Social','structured','Group','regular',45,'Hub',
 'Join a board game with others. Learn or teach the rules and play a round together.',
 array['Turn-taking','Social skills'], array['Social adaptation','Compromise','Patience'], 25,
 '[{"prompt":"Did you play a board game with others?","is_capacity":false},{"prompt":"Did you take turns?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you play again?","is_capacity":false}]'::jsonb),

('Q016','Money Smarts Quiz','Learning / Quizzes','structured','Solo','starter',15,'Hub',
 'Work through a short quiz about handling money and budgeting.',
 array['Financial literacy'], array['Learning','Self-direction'], 10,
 '[{"prompt":"Did you finish the quiz?","is_capacity":false},{"prompt":"Did you learn something new?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you try another quiz?","is_capacity":false}]'::jsonb),

('Q017','Online Safety Quiz','Learning / Quizzes','structured','Solo','starter',15,'Hub',
 'Work through a short quiz about staying safe online and protecting your info.',
 array['Online safety','Digital literacy'], array['Learning','Judgement'], 10,
 '[{"prompt":"Did you finish the quiz?","is_capacity":false},{"prompt":"Did you learn something new?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you try another quiz?","is_capacity":false}]'::jsonb),

('Q018','Walk and Talk','Health & Wellbeing','open','Group','starter',30,'Community',
 'Take a walk with a mate or mentor. Get some fresh air and a good chat.',
 array['Physical activity','Wellbeing'], array['Self-care','Communication'], 10,
 '[{"prompt":"Did you go for a walk?","is_capacity":false},{"prompt":"Did you have a good chat?","is_capacity":true},{"prompt":"Did you enjoy the fresh air?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q019','Photo Walk','Creative / Fun','open','Solo','starter',30,'Community',
 'Head out and take photos of things that catch your eye. Share a favourite.',
 array['Creativity','Observation'], array['Self-expression','Initiative'], 10,
 '[{"prompt":"Did you take some photos?","is_capacity":false},{"prompt":"Did you take one you liked?","is_capacity":true},{"prompt":"Did you enjoy it?","is_capacity":false},{"prompt":"Would you do it again?","is_capacity":false}]'::jsonb),

('Q020','Work Experience @ ESports Collective','Life Skills','structured','Solo with support','regular',180,'Hub',
 'Join the crew for a work experience shift at the ESports Collective hub. Runs 3–6pm on weekdays. Help set up, run activities, and pitch in on real tasks alongside the team.',
 array['Work skills','Teamwork','Responsibility'], array['Initiative','Responsibility','Communication'], 25,
 '[{"prompt":"Did you turn up for your shift?","is_capacity":false},{"prompt":"Did you take on your tasks yourself?","is_capacity":true},{"prompt":"Did you enjoy the work?","is_capacity":false},{"prompt":"Would you do another shift?","is_capacity":false}]'::jsonb)

on conflict (code) do nothing;
